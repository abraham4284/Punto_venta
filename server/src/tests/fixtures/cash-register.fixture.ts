import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface CashRegisterFixture {
  idCashRegister: number;
  idBusiness: number;
  name: string;
}

export async function createCashRegisterFixture(
  idBusiness: number,
  namePrefix = "Caja",
): Promise<CashRegisterFixture> {
  const name = `${namePrefix} ${randomUUID().slice(0, 8)}`;
  const idCashRegister = await executeInsert(
    `INSERT INTO cash_registers (idBusiness, name, description, is_default, is_active)
     VALUES (?, ?, ?, 0, 1)`,
    [idBusiness, name, "Caja fixture"],
  );

  return { idCashRegister, idBusiness, name };
}
