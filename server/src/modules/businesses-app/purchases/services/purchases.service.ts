import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { safeEvaluateStockNotification } from "@/modules/notifications/services/notifications.service.js";
import { generatePurchaseNumber } from "../helpers/generatePurchaseNumber.helper.js";
import type {
  CancelPurchaseInput,
  CreatePurchaseInput,
  CreatePurchaseProcedureInput,
  CreatePurchaseServiceResponse,
  GetPurchasesFilters,
  IdempotencyReplayDbRow,
  PaginatedPurchasesResponse,
  PurchaseDbRow,
  PurchaseDetailDbRow,
  PurchaseDetailResponse,
  PurchaseResponse,
  PurchaseWithDetailsResponse,
  TotalPurchasesDbRow,
} from "../types/index.js";

function toNumber(value: string | number): number {
  return Number(value);
}

function mapPurchase(row: PurchaseDbRow): PurchaseResponse {
  return {
    idPurchase: row.idPurchase,
    purchaseNumber: row.purchase_number,
    idBusiness: row.idBusiness,
    idSupplier: row.idSupplier,
    supplierName: row.supplier_name,
    idDeposit: row.idDeposit,
    depositName: row.deposit_name,
    idUser: row.idUser,
    userName: row.user_name,
    purchaseDate: row.purchase_date,
    subtotal: toNumber(row.subtotal),
    discountTotal: toNumber(row.discount_total),
    total: toNumber(row.total),
    observation: row.observation,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPurchaseDetail(row: PurchaseDetailDbRow): PurchaseDetailResponse {
  return {
    idPurchaseDetail: row.idPurchaseDetail,
    idPurchase: row.idPurchase,
    idBusiness: row.idBusiness,
    idProduct: row.idProduct,
    idDeposit: row.idDeposit,
    depositName: row.deposit_name,
    productName: row.product_name,
    barcode: row.barcode,
    productImageUrl: row.product_image_url,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    discountAmount: toNumber(row.discount_amount),
    subtotal: toNumber(row.subtotal),
    createdAt: row.created_at,
  };
}

function mapPurchaseWithDetails(
  purchase: PurchaseDbRow,
  details: PurchaseDetailDbRow[],
): PurchaseWithDetailsResponse {
  return {
    ...mapPurchase(purchase),
    details: details.map(mapPurchaseDetail),
  };
}

function isDuplicateEntryError(error: unknown): boolean {
  const parsedError = error as { code?: string; errno?: number };
  return parsedError.code === "ER_DUP_ENTRY" || parsedError.errno === 1062;
}

function getSortedPurchaseDetails(
  details: CreatePurchaseInput["details"],
): CreatePurchaseInput["details"] {
  return [...details].sort(function sortDetails(first, second) {
    if (first.idProduct !== second.idProduct) {
      return first.idProduct - second.idProduct;
    }

    return first.idDeposit - second.idDeposit;
  });
}

async function getPurchaseByIdempotencyKeyService(
  idBusiness: number,
  idempotencyKey: string,
): Promise<PurchaseWithDetailsResponse | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT idPurchase
       FROM purchases
      WHERE idBusiness = ?
        AND idempotency_key = ?
      LIMIT 1`,
    [idBusiness, idempotencyKey],
  );
  const purchase = rows[0] as { idPurchase?: number } | undefined;

  if (!purchase?.idPurchase) {
    return null;
  }

  return getPurchaseByIdService(idBusiness, Number(purchase.idPurchase));
}

export async function createPurchaseService(
  data: CreatePurchaseInput,
): Promise<CreatePurchaseServiceResponse> {
  const purchaseData: CreatePurchaseProcedureInput = {
    ...data,
    details: getSortedPurchaseDetails(data.details),
    purchaseNumber: generatePurchaseNumber(),
  };

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_create_purchase(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        purchaseData.idBusiness,
        purchaseData.idUser,
        purchaseData.purchaseNumber,
        purchaseData.idempotencyKey,
        purchaseData.idSupplier ?? null,
        purchaseData.subtotal,
        purchaseData.discountTotal,
        purchaseData.total,
        purchaseData.observation ?? null,
        JSON.stringify(purchaseData.details),
      ],
    );
    const result = rows as unknown as [
      PurchaseDbRow[],
      PurchaseDetailDbRow[],
      IdempotencyReplayDbRow[],
    ];
    const purchase = result[0]?.[0];
    const details = result[1] ?? [];
    const idempotentReplay = Boolean(result[2]?.[0]?.alreadyProcessed);

    if (!purchase) {
      throw new Error("No se pudo registrar la compra");
    }

    if (!idempotentReplay) {
      for (const detail of details) {
        await safeEvaluateStockNotification({
          idBusiness: data.idBusiness,
          idProduct: detail.idProduct,
          idDeposit: detail.idDeposit,
        });
      }
    }

    return {
      purchase: mapPurchaseWithDetails(purchase, details),
      idempotentReplay,
    };
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      const existingPurchase = await getPurchaseByIdempotencyKeyService(
        purchaseData.idBusiness,
        purchaseData.idempotencyKey,
      );

      if (existingPurchase) {
        return {
          purchase: existingPurchase,
          idempotentReplay: true,
        };
      }
    }

    throw error;
  }
}

export async function getPurchasesService(
  filters: GetPurchasesFilters,
): Promise<PaginatedPurchasesResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_purchases_by_business(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.limit,
      filters.offset,
      filters.status ?? null,
      filters.idSupplier ?? null,
      filters.idDeposit ?? null,
      filters.purchaseNumberSearch ?? null,
      filters.startDate ?? null,
      filters.endDate ?? null,
    ],
  );

  const result = rows as unknown as [PurchaseDbRow[], TotalPurchasesDbRow[]];
  const summary = result[1]?.[0];
  const totalRecords = Number(summary?.totalRecords ?? 0);
  const completed = Number(summary?.completedRecords ?? 0);
  const cancelled = Number(summary?.cancelledRecords ?? 0);
  const totalPages = Math.max(Math.ceil(totalRecords / filters.limit), 1);

  return {
    purchases: (result[0] ?? []).map(mapPurchase),
    pagination: {
      totalRecords,
      currentPage: filters.page,
      totalPages,
      limit: filters.limit,
    },
    metrics: {
      total: totalRecords,
      completed,
      completedPercentage:
        totalRecords === 0
          ? 0
          : Number(((completed / totalRecords) * 100).toFixed(2)),
      cancelled,
      cancelledPercentage:
        totalRecords === 0
          ? 0
          : Number(((cancelled / totalRecords) * 100).toFixed(2)),
      completedTotal: Number(summary?.completedTotal ?? 0),
    },
  };
}

export async function getPurchaseByIdService(
  idBusiness: number,
  idPurchase: number,
): Promise<PurchaseWithDetailsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_purchase_by_id(?, ?)",
    [idBusiness, idPurchase],
  );

  const result = rows as unknown as [PurchaseDbRow[], PurchaseDetailDbRow[]];
  const purchase = result[0]?.[0];

  if (!purchase) {
    throw new Error("Compra no encontrada");
  }

  return mapPurchaseWithDetails(purchase, result[1] ?? []);
}

export async function cancelPurchaseService(
  data: CancelPurchaseInput,
): Promise<PurchaseWithDetailsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cancel_purchase(?, ?)",
    [data.idPurchase, data.idBusiness],
  );

  const result = rows as unknown as [PurchaseDbRow[], PurchaseDetailDbRow[]];
  const purchase = result[0]?.[0];

  if (!purchase) {
    throw new Error("No se pudo anular la compra");
  }

  return mapPurchaseWithDetails(purchase, result[1] ?? []);
}
