import { randomUUID } from "node:crypto";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface CustomerFixture {
  idCustomer: number;
  idBusiness: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

export async function createCustomerFixture(
  idBusiness: number,
  namePrefix = "Cliente",
): Promise<CustomerFixture> {
  const firstName = namePrefix;
  const lastName = randomUUID().slice(0, 8);
  const fullName = `${firstName} ${lastName}`;
  const idCustomer = await executeInsert(
    `INSERT INTO customers (idBusiness, first_name, last_name, phone, email, address, observation, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [idBusiness, firstName, lastName, "111", null, "Direccion fixture", null],
  );

  return { idCustomer, idBusiness, firstName, lastName, fullName };
}
