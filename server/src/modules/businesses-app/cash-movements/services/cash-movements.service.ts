import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { mapCashMovement } from "../helpers/cash-movement.mapper.js";
import type {
  CashMovementDbRow,
  CashMovementResponse,
  CashMovementSessionPayload,
  CreateCashMovementPayload,
} from "../types/index.js";

function getFirstMovement(rows: RowDataPacket[]): CashMovementResponse {
  const result = rows as unknown as CashMovementDbRow[][];
  const movement = result[0]?.[0];

  if (!movement) {
    throw new Error("Movimiento de caja no encontrado");
  }

  return mapCashMovement(movement);
}

export async function createCashMovementService(
  data: CreateCashMovementPayload,
): Promise<CashMovementResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_movement_create(?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idCashSession,
      data.idUser,
      data.movementType,
      data.category,
      data.amount,
      data.description ?? null,
    ],
  );

  return getFirstMovement(rows);
}

export async function listCashMovementsBySessionService(
  data: CashMovementSessionPayload,
): Promise<CashMovementResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_movement_list_by_session(?, ?)",
    [data.idBusiness, data.idCashSession],
  );
  const result = rows as unknown as CashMovementDbRow[][];
  return (result[0] ?? []).map(mapCashMovement);
}
