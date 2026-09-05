import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { safeEvaluateStockNotification } from "@/modules/notifications/services/notifications.service.js";
import {
  mapProductWithStock,
  mapSale,
  mapSaleDetail,
  mapSaleDelivery,
  mapSalePayment,
} from "../helpers/sale.mapper.js";
import { generateSaleNumber } from "../helpers/saleNumber.helper.js";
import type {
  CancelSalePayload,
  CreateSalePayload,
  CreateSaleProcedurePayload,
  CreateSaleServiceResponse,
  DeliveryUserOption,
  DeliveryUserOptionDbRow,
  GetSalesFilters,
  PaginatedSalesResponse,
  ProductWithStockDbRow,
  ProductWithStockResponse,
  SaleDbRow,
  SaleDetailDbRow,
  SaleDeliveryDbRow,
  SalePaymentDbRow,
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
    "CALL sp_create_sale(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.saleNumber,
      data.idempotencyKey,
      data.idCustomer ?? null,
      data.idDeposit,
      data.idCashSession,
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

async function callCreateSalePaymentsProcedure(
  connection: PoolConnection,
  data: CreateSalePayload,
  idSale: number,
): Promise<void> {
  for (const payment of data.payments) {
    await connection.query<RowDataPacket[]>(
      "CALL sp_sale_payment_create(?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.idBusiness,
        idSale,
        payment.idPaymentMethod,
        payment.amount,
        payment.status,
        data.idUser,
        payment.status === "CONFIRMED" ? data.idCashSession : null,
        payment.reference ?? null,
        payment.observation ?? null,
      ],
    );
  }
}

async function callCreateDeliveryProcedure(
  connection: PoolConnection,
  data: CreateSalePayload,
  idSale: number,
): Promise<void> {
  if (!data.delivery) {
    return;
  }

  await connection.query<RowDataPacket[]>(
    "CALL sp_delivery_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      idSale,
      data.idUser,
      data.delivery.assignedToUserId ?? null,
      data.delivery.recipientName,
      data.delivery.recipientPhone ?? null,
      data.delivery.deliveryAddress,
      data.delivery.deliveryReference ?? null,
      data.delivery.scheduledAt ?? null,
      data.delivery.observation ?? null,
    ],
  );
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
      await callCreateSalePaymentsProcedure(connection, saleData, idSale);
      await callCreateDeliveryProcedure(connection, saleData, idSale);
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

export async function getDeliveryUsersForSaleService(
  idBusiness: number,
): Promise<DeliveryUserOption[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
        u.idUser,
        u.name,
        u.username
       FROM business_users bu
       INNER JOIN users u ON u.idUser = bu.idUser
       WHERE bu.idBusiness = ?
         AND bu.role = 'DELIVERY'
         AND bu.is_active = 1
         AND u.is_active = 1
       ORDER BY u.name ASC, u.username ASC`,
    [idBusiness],
  );

  return (rows as DeliveryUserOptionDbRow[]).map(function mapDeliveryUser(row) {
    return {
      idUser: Number(row.idUser),
      name: row.name,
      username: row.username,
    };
  });
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

  const result = rows as unknown as [
    SaleDbRow[],
    SaleDetailDbRow[],
    SalePaymentDbRow[],
    SaleDeliveryDbRow[],
  ];
  const sale = result[0]?.[0];

  if (!sale) {
    throw new Error("Venta no encontrada");
  }

  return {
    ...mapSale(sale),
    items: (result[1] ?? []).map(mapSaleDetail),
    payments: (result[2] ?? []).map(mapSalePayment),
    delivery: result[3]?.[0] ? mapSaleDelivery(result[3][0]) : null,
  };
}

export async function cancelSaleService(
  data: CancelSalePayload,
): Promise<SaleWithDetailsResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cancel_sale_and_revert_stock(?, ?)",
    [data.idSale, data.idBusiness],
  );

  const result = rows as unknown as [
    SaleDbRow[],
    SaleDetailDbRow[],
    SalePaymentDbRow[],
    SaleDeliveryDbRow[],
  ];
  const sale = result[0]?.[0];

  if (!sale) {
    throw new Error("No se pudo anular la venta");
  }

  return {
    ...mapSale(sale),
    items: (result[1] ?? []).map(mapSaleDetail),
    payments: (result[2] ?? []).map(mapSalePayment),
    delivery: result[3]?.[0] ? mapSaleDelivery(result[3][0]) : null,
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
