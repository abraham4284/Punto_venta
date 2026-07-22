import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapDeposit } from "../helpers/deposit.mapper.js";
import type {
  CreateDepositBody,
  DepositDbRow,
  DepositResponse,
  UpdateDepositBody,
} from "../types/deposit.types.js";

export async function createDepositService(
  idBusiness: number,
  data: CreateDepositBody,
): Promise<DepositResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_deposit(?, ?, ?, ?)",
    [
      idBusiness,
      data.name,
      data.description ?? null,
      data.isDefault ? 1 : 0,
    ],
  );

  const result = rows as unknown as DepositDbRow[][];
  const deposit = result[0]?.[0];

  if (!deposit) {
    throw new Error("No se pudo crear el deposito");
  }

  return mapDeposit(deposit);
}

export async function getDepositsService(
  idBusiness: number,
): Promise<DepositResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_get_deposits(?)", [
    idBusiness,
  ]);

  const result = rows as unknown as DepositDbRow[][];
  return (result[0] ?? []).map(mapDeposit);
}

export async function getDepositByIdService(
  idBusiness: number,
  idDeposit: number,
): Promise<DepositResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_deposit_by_id(?, ?)",
    [idBusiness, idDeposit],
  );

  const result = rows as unknown as DepositDbRow[][];
  const deposit = result[0]?.[0];

  if (!deposit) {
    throw new Error("Deposito no encontrado");
  }

  return mapDeposit(deposit);
}

export async function updateDepositService(
  idBusiness: number,
  idDeposit: number,
  data: UpdateDepositBody,
): Promise<DepositResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_deposit(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      idBusiness,
      idDeposit,
      data.name ?? null,
      data.description ?? null,
      Object.hasOwn(data, "description") ? 1 : 0,
      data.isDefault === undefined ? null : data.isDefault ? 1 : 0,
      Object.hasOwn(data, "isDefault") ? 1 : 0,
      data.isActive === undefined ? null : data.isActive ? 1 : 0,
      Object.hasOwn(data, "isActive") ? 1 : 0,
    ],
  );

  const result = rows as unknown as DepositDbRow[][];
  const deposit = result[0]?.[0];

  if (!deposit) {
    throw new Error("Deposito no encontrado");
  }

  return mapDeposit(deposit);
}
