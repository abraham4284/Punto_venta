import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface DepositFixture {
  idDeposit: number;
  idBusiness: number;
  name: string;
}

export async function createDepositFixture(
  idBusiness: number,
  namePrefix = "Deposito",
): Promise<DepositFixture> {
  const name = `${namePrefix} ${randomUUID().slice(0, 8)}`;
  const idDeposit = await executeInsert(
    `INSERT INTO deposits (idBusiness, name, description, is_default, is_active)
     VALUES (?, ?, ?, 0, 1)`,
    [idBusiness, name, "Deposito fixture"],
  );

  return { idDeposit, idBusiness, name };
}
