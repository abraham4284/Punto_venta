import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface CashSessionFixture {
  idCashSession: number;
  idBusiness: number;
  idCashRegister: number;
}

export async function createCashSessionFixture(input: {
  idBusiness: number;
  idCashRegister: number;
  idUser: number;
  openingAmount?: number;
}): Promise<CashSessionFixture> {
  const idCashSession = await executeInsert(
    `INSERT INTO cash_sessions
      (idBusiness, idCashRegister, opened_by_user_id, status, opening_amount, opening_observation)
     VALUES (?, ?, ?, 'OPEN', ?, ?)`,
    [
      input.idBusiness,
      input.idCashRegister,
      input.idUser,
      input.openingAmount ?? 0,
      "Sesion fixture",
    ],
  );

  return {
    idCashSession,
    idBusiness: input.idBusiness,
    idCashRegister: input.idCashRegister,
  };
}
