import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface CustomerFixture {
  idCustomer: number;
  idBusiness: number;
  name: string;
}

export async function createCustomerFixture(
  idBusiness: number,
  namePrefix = "Cliente",
): Promise<CustomerFixture> {
  const name = `${namePrefix} ${randomUUID().slice(0, 8)}`;
  const idCustomer = await executeInsert(
    `INSERT INTO customers (idBusiness, name, phone, email, address, observation, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [idBusiness, name, "111", null, "Direccion fixture", null],
  );

  return { idCustomer, idBusiness, name };
}
