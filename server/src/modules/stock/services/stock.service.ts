import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapStock } from "../helpers/stock.mapper.js";
import type {
  CreateInitialStockPayload,
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
