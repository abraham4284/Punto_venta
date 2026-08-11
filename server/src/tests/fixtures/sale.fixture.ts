import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface SaleFixture {
  idSale: number;
  idBusiness: number;
  saleNumber: string;
}

export async function createSaleFixture(input: {
  idBusiness: number;
  idDeposit: number;
  idCashSession: number;
  idUser: number;
  idPaymentMethod: number;
  idProduct: number;
  idCustomer?: number | null;
}): Promise<SaleFixture> {
  const saleNumber = `VTA-TEST-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const idempotencyKey = `fixture-sale-${randomUUID()}`;
  const idSale = await executeInsert(
    `INSERT INTO sales
      (idBusiness, idDeposit, idCashSession, idUser, idCustomer, idPaymentMethod, sale_number, idempotency_key, subtotal, discount_total, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 20, 0, 20, 'COMPLETED')`,
    [
      input.idBusiness,
      input.idDeposit,
      input.idCashSession,
      input.idUser,
      input.idCustomer ?? null,
      input.idPaymentMethod,
      saleNumber,
      idempotencyKey,
    ],
  );

  await executeInsert(
    `INSERT INTO sale_details
      (idBusiness, idSale, idProduct, quantity, unit_price, discount_amount, subtotal)
     VALUES (?, ?, ?, 1, 20, 0, 20)`,
    [input.idBusiness, idSale, input.idProduct],
  );

  return { idSale, idBusiness: input.idBusiness, saleNumber };
}
