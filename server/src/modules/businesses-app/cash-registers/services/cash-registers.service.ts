import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { mapCashRegister } from "../helpers/cash-register.mapper.js";
import type {
  CashRegisterDbRow,
  CashRegisterIdPayload,
  CashRegisterResponse,
  ChangeCashRegisterStatusPayload,
  CreateCashRegisterPayload,
  UpdateCashRegisterPayload,
} from "../types/index.js";

function getFirstRegister(rows: RowDataPacket[]): CashRegisterResponse {
  const result = rows as unknown as CashRegisterDbRow[][];
  const register = result[0]?.[0];

  if (!register) {
    throw new Error("CASH_REGISTER_NOT_FOUND");
  }

  return mapCashRegister(register);
}

export async function createCashRegisterService(
  data: CreateCashRegisterPayload,
): Promise<CashRegisterResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_register_create(?, ?, ?, ?)",
    [
      data.idBusiness,
      data.name,
      data.description ?? null,
      data.isDefault ? 1 : 0,
    ],
  );

  return getFirstRegister(rows);
}

export async function listCashRegistersService(
  idBusiness: number,
): Promise<CashRegisterResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_register_list(?)",
    [idBusiness],
  );
  const result = rows as unknown as CashRegisterDbRow[][];
  return (result[0] ?? []).map(mapCashRegister);
}

export async function getCashRegisterByIdService(
  data: CashRegisterIdPayload,
): Promise<CashRegisterResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_register_get_by_id(?, ?)",
    [data.idBusiness, data.idCashRegister],
  );

  return getFirstRegister(rows);
}

export async function updateCashRegisterService(
  data: UpdateCashRegisterPayload,
): Promise<CashRegisterResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_register_update(?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idCashRegister,
      data.name,
      data.description ?? null,
      data.isDefault ? 1 : 0,
    ],
  );

  return getFirstRegister(rows);
}

export async function changeCashRegisterStatusService(
  data: ChangeCashRegisterStatusPayload,
): Promise<CashRegisterResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_register_change_status(?, ?, ?)",
    [data.idBusiness, data.idCashRegister, data.isActive ? 1 : 0],
  );

  return getFirstRegister(rows);
}

export async function setDefaultCashRegisterService(
  data: CashRegisterIdPayload,
): Promise<CashRegisterResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_cash_register_set_default(?, ?)",
    [data.idBusiness, data.idCashRegister],
  );

  return getFirstRegister(rows);
}
