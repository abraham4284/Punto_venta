import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapStock } from "../helpers/stock.mapper.js";
import type {
  CreateInitialStockPayload,
  CriticalStockReportFilters,
  CriticalStockReportResponse,
  CriticalStockReportRow,
  StockDbRow,
  StockResponse,
} from "../types/index.js";

export async function createInitialStockService(
  data: CreateInitialStockPayload,
): Promise<StockResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_initial_stock(?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.idProduct,
      data.idDeposit,
      data.quantity,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as StockDbRow[][];
  const stock = result[0]?.[0];

  if (!stock) {
    throw new Error("No se pudo registrar el stock inicial");
  }

  return mapStock(stock);
}

export async function getStockService(
  idBusiness: number,
): Promise<StockResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_get_stock(?)", [
    idBusiness,
  ]);

  const result = rows as unknown as StockDbRow[][];
  return (result[0] ?? []).map(mapStock);
}

export async function getStockByIdService(
  idBusiness: number,
  idStock: number,
): Promise<StockResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_stock_by_id(?, ?)",
    [idBusiness, idStock],
  );

  const result = rows as unknown as StockDbRow[][];
  const stock = result[0]?.[0];

  if (!stock) {
    throw new Error("Stock no encontrado");
  }

  return mapStock(stock);
}

export async function getCriticalStockReportService(
  filters: CriticalStockReportFilters,
): Promise<CriticalStockReportResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_critical_stock_report(?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.maxQuantity,
      filters.idDeposit ?? null,
      filters.searchProduct ?? null,
    ],
  );

  const result = rows as unknown as CriticalStockReportRow[][];

  return (result[0] ?? []).map(function mapCriticalStock(row) {
    return {
      idStock: row.idStock,
      idBusiness: row.idBusiness,
      idProduct: row.idProduct,
      productName: row.product_name,
      barcode: row.barcode,
      imageUrl: row.image_url,
      idDeposit: row.idDeposit,
      depositName: row.deposit_name,
      quantity: Number(row.quantity),
      stockMin: Number(row.stock_min),
      alertStatus: row.alert_status,
      alertMessage: row.alert_message,
    };
  });
}
