import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "@/types/auth.types.js";

function normalizeCookies(cookies: string[] | string): string[] {
  return Array.isArray(cookies) ? cookies : [cookies];
}

export function getSessionCookiesForRequest(cookies: string[] | string): string[] {
  return normalizeCookies(cookies).filter(function keepSessionCookie(cookie) {
    const [pair] = cookie.split(";");
    const [name, value] = pair.split("=");

    return (
      (name === "access_token" || name === "refresh_token") &&
      Boolean(value)
    );
  });
}

export function getCookieByName(cookies: string[] | string, name: string): string {
  const cookie = normalizeCookies(cookies).find(function findCookie(value) {
    const [pair] = value.split(";");
    const [cookieName, cookieValue] = pair.split("=");
    return cookieName === name && Boolean(cookieValue);
  });

  if (!cookie) {
    throw new Error(`No se encontro la cookie ${name}`);
  }

  return cookie;
}

export function getCookieToken(cookies: string[] | string, name: string): string {
  const cookie = getCookieByName(cookies, name);
  const [pair] = cookie.split(";");
  const [, value] = pair.split("=");

  if (!value) {
    throw new Error(`La cookie ${name} no contiene token`);
  }

  return value;
}

export function expectHttpOnlyCookie(cookies: string[] | string, name: string): void {
  const cookie = getCookieByName(cookies, name);

  if (!cookie.toLowerCase().includes("httponly")) {
    throw new Error(`La cookie ${name} debe ser httpOnly`);
  }
}

export function decodeAccessTokenForTest(token: string): AccessTokenPayload {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded !== "object") {
    throw new Error("No se pudo decodificar el access token");
  }

  return decoded as AccessTokenPayload;
}

export function decodeRefreshTokenForTest(token: string): RefreshTokenPayload {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded !== "object") {
    throw new Error("No se pudo decodificar el refresh token");
  }

  return decoded as RefreshTokenPayload;
}

export function createRawJwtForTest(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: SignOptions["expiresIn"] = "15m",
): string {
  return jwt.sign(payload, secret, { expiresIn });
}
