import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { generatePurchaseNumber } from "../helpers/generatePurchaseNumber.helper.js";
import type {
  CancelPurchaseInput,
  CreatePurchaseInput,
  CreatePurchaseProcedureInput,
  GetPurchasesFilters,
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

export async function createPurchaseService(
  data: CreatePurchaseInput,
): Promise<PurchaseWithDetailsResponse> {
  const purchaseData: CreatePurchaseProcedureInput = {
    ...data,
    purchaseNumber: generatePurchaseNumber(),
  };

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_purchase(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      purchaseData.idBusiness,
      purchaseData.idUser,
      purchaseData.purchaseNumber,
      purchaseData.idSupplier ?? null,
      purchaseData.subtotal,
      purchaseData.discountTotal,
      purchaseData.total,
      purchaseData.observation ?? null,
      JSON.stringify(purchaseData.details),
    ],
  );
  console.log(rows,'rows')

  const result = rows as unknown as [PurchaseDbRow[], PurchaseDetailDbRow[]];
  const purchase = result[0]?.[0];

  if (!purchase) {
    throw new Error("No se pudo registrar la compra");
  }

  return mapPurchaseWithDetails(purchase, result[1] ?? []);
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
