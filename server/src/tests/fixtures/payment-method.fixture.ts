import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface PaymentMethodFixture {
  idPaymentMethod: number;
  idBusiness: number;
  name: string;
}

export async function createPaymentMethodFixture(
  idBusiness: number,
  namePrefix = "Transferencia",
): Promise<PaymentMethodFixture> {
  const name = `${namePrefix} ${randomUUID().slice(0, 8)}`;
  const idPaymentMethod = await executeInsert(
    `INSERT INTO payment_methods (idBusiness, code, name, affects_cash, is_default, is_active)
     VALUES (?, 'TRANSFER', ?, 0, 0, 1)`,
    [idBusiness, name],
  );

  return { idPaymentMethod, idBusiness, name };
}
