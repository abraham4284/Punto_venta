import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { PlatformRole } from "@/types/auth.types.js";
import { executeInsert } from "@/tests/helpers/test-database.helper.js";
import { loginPlatformTestUser } from "@/tests/helpers/platform-auth-test.helper.js";

export interface PlatformUserFixture {
  idUser: number;
  idPlatformUser: number;
  username: string;
  email: string;
  plainPasswordForTest: string;
  role: PlatformRole;
  auth: {
    cookies: string[];
  };
}

export async function createPlatformUserFixture(input: {
  role?: PlatformRole;
  userIsActive?: boolean;
  platformUserIsActive?: boolean;
  login?: boolean;
} = {}): Promise<PlatformUserFixture> {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const role = input.role ?? "SUPER_ADMIN";
  const username = `platform_${role.toLowerCase()}_${suffix}`;
  const email = `${username}@platform.test`;
  const plainPasswordForTest = `Platform-${suffix}-123`;
  const passwordHash = await bcrypt.hash(plainPasswordForTest, 10);

  const idUser = await executeInsert(
    `INSERT INTO users (name, username, email, password_hash, is_active, must_change_password)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [
      `Platform ${role} ${suffix}`,
      username,
      email,
      passwordHash,
      input.userIsActive === false ? 0 : 1,
    ],
  );

  const idPlatformUser = await executeInsert(
    `INSERT INTO platform_users (idUser, role, is_active)
     VALUES (?, ?, ?)`,
    [idUser, role, input.platformUserIsActive === false ? 0 : 1],
  );

  const auth = input.login === false
    ? { cookies: [] }
    : await loginPlatformTestUser({ username, password: plainPasswordForTest });

  return {
    idUser,
    idPlatformUser,
    username,
    email,
    plainPasswordForTest,
    role,
    auth,
  };
}
