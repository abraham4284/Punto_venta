import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import {
  mapProductWithStock,
  mapSale,
  mapSaleDetail,
} from "../helpers/sale.mapper.js";
import type {
  CancelSalePayload,
  CreateSalePayload,
  ProductWithStockDbRow,
  ProductWithStockResponse,
  SaleDbRow,
  SaleDetailDbRow,
  SaleIdDbRow,
  SaleResponse,
  SaleWithDetailsResponse,
} from "../types/index.js";

async function callCreateSaleProcedure(
  connection: PoolConnection,
  data: CreateSalePayload,
): Promise<number> {
  console.log("Ingreso a callCreateSaleProcedure",data);
  const [rows] = await connection.query<RowDataPacket[]>(
    "CALL sp_create_sale(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.idCustomer ?? null,
      data.idDeposit,
      data.idPaymentMethod ?? null,
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

  return sale.idSale;
}

async function callCreateSaleDetailProcedure(
  connection: PoolConnection,
  data: CreateSalePayload,
  idSale: number,
): Promise<void> {
  console.log("Ingreso al procedimiento de detalle de venta", data.items);
  for (const item of data.items) {
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
): Promise<SaleWithDetailsResponse> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const idSale = await callCreateSaleProcedure(connection, data);
    await callCreateSaleDetailProcedure(connection, data, idSale);

    await connection.commit();

    return getSaleByIdService(data.idBusiness, idSale);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSalesService(
  idBusiness: number,
): Promise<SaleResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_get_sales(?)", [
    idBusiness,
  ]);

  const result = rows as unknown as SaleDbRow[][];
  return (result[0] ?? []).map(mapSale);
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
