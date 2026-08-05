import request from "supertest";
import type { PlatformRole } from "@/types/auth.types.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { getSessionCookiesForRequest } from "@/tests/helpers/auth-token-test.helper.js";

export interface PlatformAuthFixture {
  cookies: string[];
  idPlatformUser: number;
  idUser: number;
  role: PlatformRole;
}

export async function loginPlatformTestUser(input: {
  username: string;
  password: string;
}): Promise<PlatformAuthFixture> {
  const response = await request(getTestApp())
    .post("/api/platform/auth/login")
    .send({
      username: input.username,
      password: input.password,
    });

  if (response.status !== 200) {
    throw new Error(`No se pudo autenticar el usuario platform de prueba: ${response.text}`);
  }

  const cookies = response.headers["set-cookie"];

  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("El login platform de prueba no devolvio cookies de sesion");
  }

  return {
    cookies: getSessionCookiesForRequest(cookies),
    idPlatformUser: Number(response.body.data.user.idPlatformUser),
    idUser: Number(response.body.data.user.idUser),
    role: response.body.data.user.platformRole as PlatformRole,
  };
}
