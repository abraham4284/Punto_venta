import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";

export interface BusinessUserFixture {
  idUser: number;
  idBusiness: number;
  username: string;
  email: string;
  plainPasswordForTest: string;
  role: "OWNER" | "ADMIN" | "SELLER" | "DELIVERY";
}

export async function createBusinessUserFixture(input: {
  idBusiness: number;
  role?: "ADMIN" | "SELLER" | "DELIVERY";
  isActive?: boolean;
  businessUserIsActive?: boolean;
  mustChangePassword?: boolean;
  usernamePrefix?: string;
}): Promise<BusinessUserFixture> {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const usernamePrefix = input.usernamePrefix ?? "business_user";
  const username = `${usernamePrefix}_${suffix}`;
  const email = `${usernamePrefix}_${suffix}@tenant.test`;
  const plainPasswordForTest = `User-${suffix}-123`;
  const passwordHash = await bcrypt.hash(plainPasswordForTest, 10);
  const role = input.role ?? "SELLER";
  const idUser = await executeInsert(
    `INSERT INTO users (name, username, email, password_hash, is_active, must_change_password)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      `Business User ${suffix}`,
      username,
      email,
      passwordHash,
      input.isActive === false ? 0 : 1,
      input.mustChangePassword ? 1 : 0,
    ],
  );

  await executeInsert(
    `INSERT INTO business_users (idBusiness, idUser, role, is_active)
     VALUES (?, ?, ?, ?)`,
    [input.idBusiness, idUser, role, input.businessUserIsActive === false ? 0 : 1],
  );

  return {
    idUser,
    idBusiness: input.idBusiness,
    username,
    email,
    plainPasswordForTest,
    role,
  };
}
