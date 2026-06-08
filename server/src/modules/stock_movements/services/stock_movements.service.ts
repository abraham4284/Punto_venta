import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapStockMovement } from "../helpers/stock-movement.mapper.js";
import type {
  ProcessStockAdjustmentPayload,
  ProcessStockTransferPayload,
  StockMovementDbRow,
  StockMovementResponse,
} from "../types/index.js";

export async function getStockMovementsService(
  idBusiness: number,
): Promise<StockMovementResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_stock_movements(?)",
    [idBusiness],
  );

  const result = rows as unknown as StockMovementDbRow[][];
  return (result[0] ?? []).map(mapStockMovement);
}

export async function processStockAdjustmentService(
  data: ProcessStockAdjustmentPayload,
): Promise<StockMovementResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_process_stock_adjustment(?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.idProduct,
      data.idDeposit,
      data.quantity,
      data.type,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as StockMovementDbRow[][];
  return (result[0] ?? []).map(mapStockMovement);
}

export async function processStockTransferService(
  data: ProcessStockTransferPayload,
): Promise<StockMovementResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_process_stock_transfer(?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idUser,
      data.idProduct,
      data.idDepositFrom,
      data.idDepositTo,
      data.quantity,
      data.observation ?? null,
    ],
  );

  const result = rows as unknown as StockMovementDbRow[][];
  return (result[0] ?? []).map(mapStockMovement);
}
