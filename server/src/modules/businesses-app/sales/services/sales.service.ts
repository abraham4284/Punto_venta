import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { safeEvaluateStockNotification } from "@/modules/notifications/services/notifications.service.js";
import {
  mapProductWithStock,
  mapSale,
  mapSaleDetail,
} from "../helpers/sale.mapper.js";
import { generateSaleNumber } from "../helpers/saleNumber.helper.js";
import type {
  CancelSalePayload,
  CreateSalePayload,
  CreateSaleProcedurePayload,
  CreateSaleServiceResponse,
  GetSalesFilters,
  PaginatedSalesResponse,
  ProductWithStockDbRow,
  ProductWithStockResponse,
  SaleDbRow,
  SaleDetailDbRow,
  SaleIdDbRow,
  SaleResponse,
  SaleWithDetailsResponse,
  TotalRecordsDbRow,
} from "../types/index.js";

async function callCreateSaleProcedure(
  connection: PoolConnection,
  data: CreateSaleProcedurePayload,
): Promise<SaleIdDbRow> {
  const [rows] = await connection.query<RowDataPacket[]>(
    "CALL sp_create_sale(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.saleNumber,
      data.idempotencyKey,
      data.idCustomer ?? null,
      data.idDeposit,
      data.idCashSession,
      data.idPaymentMethod,
      data.subtotal,
      data.discountTotal,
      data.total,
      data.observation ?? null,
    ],
  );
  const result = rows as unknown as SaleIdDbRow[][];
  const sale = result[0]?.[0];

  if (!sale) {
    throw new Error("No se pudo crear la venta");
  }

  return sale;
}

function isDuplicateEntryError(error: unknown): boolean {
  const parsedError = error as { code?: string; errno?: number };
  return parsedError.code === "ER_DUP_ENTRY" || parsedError.errno === 1062;
}

async function getSaleByIdempotencyKeyService(
  idBusiness: number,
  idempotencyKey: string,
): Promise<SaleWithDetailsResponse | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT idSale
       FROM sales
      WHERE idBusiness = ?
        AND idempotency_key = ?
      LIMIT 1`,
    [idBusiness, idempotencyKey],
  );
  const sale = rows[0] as { idSale?: number } | undefined;

  if (!sale?.idSale) {
    return null;
  }

  return getSaleByIdService(idBusiness, Number(sale.idSale));
}

function getSortedSaleItems(data: CreateSalePayload): CreateSalePayload["items"] {
  return [...data.items].sort(function sortItems(first, second) {
    return first.idProduct - second.idProduct;
  });
}

async function callCreateSaleDetailProcedure(
  connection: PoolConnection,
  data: CreateSalePayload,
  idSale: number,
): Promise<void> {
  for (const item of getSortedSaleItems(data)) {
    await connection.query<RowDataPacket[]>(
      "CALL sp_create_sale_detail_and_discount_stock(?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.idBusiness,
        data.idUser,
        idSale,
        item.idProduct,
        data.idDeposit,
        item.quantity,
        item.unitPrice,
        item.discount,
        item.total,
      ],
    );
  }
}

export async function createSaleService(
  data: CreateSalePayload,
): Promise<CreateSaleServiceResponse> {
  const connection = await pool.getConnection();
  const saleData: CreateSaleProcedurePayload = {
    ...data,
    saleNumber: generateSaleNumber(),
  };

  try {
    await connection.beginTransaction();
    const createdSale = await callCreateSaleProcedure(connection, saleData);
    const idSale = Number(createdSale.idSale);

    if (!createdSale.alreadyProcessed) {
      await callCreateSaleDetailProcedure(connection, saleData, idSale);
    }

    await connection.commit();

    if (createdSale.alreadyProcessed) {
      return {
        sale: await getSaleByIdService(saleData.idBusiness, idSale),
        idempotentReplay: true,
      };
    }

    for (const item of getSortedSaleItems(saleData)) {
      await safeEvaluateStockNotification({
        idBusiness: saleData.idBusiness,
        idProduct: item.idProduct,
        idDeposit: saleData.idDeposit,
      });
    }

    return {
      sale: await getSaleByIdService(saleData.idBusiness, idSale),
      idempotentReplay: false,
    };
  } catch (error) {
    console.log(error,'error')
    await connection.rollback();

    if (isDuplicateEntryError(error)) {
      const existingSale = await getSaleByIdempotencyKeyService(
        saleData.idBusiness,
        saleData.idempotencyKey,
      );

      if (existingSale) {
        return {
          sale: existingSale,
          idempotentReplay: true,
        };
      }
    }

    throw error;
  } finally {
    connection.release();
  }
}

export async function getSalesService(
  filters: GetSalesFilters,
): Promise<PaginatedSalesResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_sales(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.limit,
      filters.offset,
      filters.idDeposit ?? null,
      filters.idPaymentMethod ?? null,
      filters.status ?? null,
      filters.saleNumberSearch ?? null,
      filters.startDate ?? null,
      filters.endDate ?? null,
    ],
  );

  const result = rows as unknown as [SaleDbRow[], TotalRecordsDbRow[]];
  const summary = result[1]?.[0];
  const totalRecords = Number(summary?.totalRecords ?? 0);
  const completed = Number(summary?.completedRecords ?? 0);
  const cancelled = Number(summary?.cancelledRecords ?? 0);
  const totalPages = Math.max(Math.ceil(totalRecords / filters.limit), 1);

  return {
    sales: (result[0] ?? []).map(mapSale),
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
        totalRecords === 0 ? 0 : Number(((completed / totalRecords) * 100).toFixed(2)),
      cancelled,
      cancelledPercentage:
        totalRecords === 0 ? 0 : Number(((cancelled / totalRecords) * 100).toFixed(2)),
      completedTotal: Number(summary?.completedTotal ?? 0),
    },
  };
}

export async function getSaleByIdService(
  idBusiness: number,
  idSale: number,
): Promise<SaleWithDetailsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_sale_by_id(?, ?)",
    [idBusiness, idSale],
  );

  const result = rows as unknown as [SaleDbRow[], SaleDetailDbRow[]];
  const sale = result[0]?.[0];

  if (!sale) {
    throw new Error("Venta no encontrada");
  }

  return {
    ...mapSale(sale),
    items: (result[1] ?? []).map(mapSaleDetail),
  };
}

export async function cancelSaleService(
  data: CancelSalePayload,
): Promise<SaleWithDetailsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cancel_sale_and_revert_stock(?, ?)",
    [data.idSale, data.idBusiness],
  );

  const result = rows as unknown as [SaleDbRow[], SaleDetailDbRow[]];
  const sale = result[0]?.[0];

  if (!sale) {
    throw new Error("No se pudo anular la venta");
  }

  return {
    ...mapSale(sale),
    items: (result[1] ?? []).map(mapSaleDetail),
  };
}

export async function getProductsWithStockByDepositService(
  idBusiness: number,
  idDeposit: number,
): Promise<ProductWithStockResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_products_with_stock_by_deposit(?, ?)",
    [idBusiness, idDeposit],
  );

  const result = rows as unknown as ProductWithStockDbRow[][];
  return (result[0] ?? []).map(mapProductWithStock);
}
