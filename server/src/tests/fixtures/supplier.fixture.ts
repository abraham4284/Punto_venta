import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface SupplierFixture {
  idSupplier: number;
  idBusiness: number;
  name: string;
}

export async function createSupplierFixture(
  idBusiness: number,
  namePrefix = "Proveedor",
): Promise<SupplierFixture> {
  const name = `${namePrefix} ${randomUUID().slice(0, 8)}`;
  const idSupplier = await executeInsert(
    `INSERT INTO suppliers (idBusiness, name, phone, email, address, observation, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [idBusiness, name, "222", null, "Direccion fixture", null],
  );

  return { idSupplier, idBusiness, name };
}
