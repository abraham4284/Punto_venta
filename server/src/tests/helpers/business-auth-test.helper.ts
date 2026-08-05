import request from "supertest";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { getSessionCookiesForRequest } from "@/tests/helpers/auth-token-test.helper.js";

export interface BusinessTestAuth {
  cookies: string[];
}

export async function loginBusinessTestUser(input: {
  username: string;
  password: string;
}): Promise<BusinessTestAuth> {
  const response = await request(getTestApp())
    .post("/api/login")
    .send({
      username: input.username,
      password: input.password,
    });

  if (response.status !== 200) {
    throw new Error(`No se pudo autenticar el usuario de prueba: ${response.text}`);
  }

  const cookies = response.headers["set-cookie"];

  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("El login de prueba no devolvio cookies de sesion");
  }

  return { cookies: getSessionCookiesForRequest(cookies) };
}
