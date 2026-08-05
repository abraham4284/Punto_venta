import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface BusinessUserFixture {
  idUser: number;
  idBusiness: number;
  username: string;
  email: string;
  role: "OWNER" | "ADMIN" | "SELLER";
}

export async function createBusinessUserFixture(input: {
  idBusiness: number;
  role?: "ADMIN" | "SELLER";
}): Promise<BusinessUserFixture> {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const username = `seller_${suffix}`;
  const email = `seller_${suffix}@tenant.test`;
  const passwordHash = await bcrypt.hash(`Seller-${suffix}-123`, 10);
  const role = input.role ?? "SELLER";
  const idUser = await executeInsert(
    `INSERT INTO users (name, username, email, password_hash, is_active, must_change_password)
     VALUES (?, ?, ?, ?, 1, 0)`,
    [`Seller ${suffix}`, username, email, passwordHash],
  );

  await executeInsert(
    `INSERT INTO business_users (idBusiness, idUser, role, is_active)
     VALUES (?, ?, ?, 1)`,
    [input.idBusiness, idUser, role],
  );

  return {
    idUser,
    idBusiness: input.idBusiness,
    username,
    email,
    role,
  };
}
