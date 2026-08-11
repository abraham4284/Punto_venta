import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface PurchaseFixture {
  idPurchase: number;
  idBusiness: number;
  purchaseNumber: string;
}

export async function createPurchaseFixture(input: {
  idBusiness: number;
  idUser: number;
  idSupplier: number;
  idProduct: number;
  idDeposit: number;
}): Promise<PurchaseFixture> {
  const purchaseNumber = `PUR-TEST-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const idempotencyKey = `fixture-purchase-${randomUUID()}`;
  const idPurchase = await executeInsert(
    `INSERT INTO purchases
      (idBusiness, idUser, idSupplier, purchase_number, idempotency_key, subtotal, discount_total, total, observation, status)
     VALUES (?, ?, ?, ?, ?, 10, 0, 10, ?, 'COMPLETED')`,
    [
      input.idBusiness,
      input.idUser,
      input.idSupplier,
      purchaseNumber,
      idempotencyKey,
      "Compra fixture",
    ],
  );

  await executeInsert(
    `INSERT INTO purchase_details
      (idBusiness, idPurchase, idProduct, idDeposit, quantity, unit_cost, discount_amount, subtotal)
     VALUES (?, ?, ?, ?, 1, 10, 0, 10)`,
    [
      input.idBusiness,
      idPurchase,
      input.idProduct,
      input.idDeposit,
    ],
  );

  return { idPurchase, idBusiness: input.idBusiness, purchaseNumber };
}
