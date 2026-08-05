import jwt from "jsonwebtoken";
import type {
  AccessTokenInput,
  AccessTokenPayload,
  BusinessRole,
  PlatformRole,
  RefreshTokenInput,
  RefreshTokenPayload,
} from "@/types/auth.types.js";
export type { AccessTokenPayload, RefreshTokenPayload } from "@/types/auth.types.js";

const accessSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

if (!accessSecret) {
  throw new Error("ACCESS_TOKEN_SECRET is required");
}

if (!refreshSecret) {
  throw new Error("REFRESH_TOKEN_SECRET is required");
}

const ACCESS_SECRET: string = accessSecret;
const REFRESH_SECRET: string = refreshSecret;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function normalizeVerifiedAccessPayload(payload: unknown): AccessTokenPayload {
  if (!isRecord(payload)) {
    throw new Error("Token invalido");
  }

  if (payload.context === "PLATFORM") {
    if (
      !isPositiveInteger(payload.idUser) ||
      !["SUPER_ADMIN", "SUPPORT", "ANALYST"].includes(String(payload.platformRole))
    ) {
      throw new Error("Token invalido");
    }

    return {
      context: "PLATFORM",
      idUser: payload.idUser,
      platformRole: payload.platformRole as PlatformRole,
    };
  }

  if (payload.context === "BUSINESS") {
    if (
      !isPositiveInteger(payload.idUser) ||
      !isPositiveInteger(payload.idBusiness) ||
      !["OWNER", "ADMIN", "SELLER"].includes(String(payload.businessRole))
    ) {
      throw new Error("Token invalido");
    }

    return {
      context: "BUSINESS",
      idUser: payload.idUser,
      idBusiness: payload.idBusiness,
      businessRole: payload.businessRole as BusinessRole,
    };
  }

  throw new Error("Token invalido");
}

function normalizeVerifiedRefreshPayload(payload: unknown): RefreshTokenPayload {
  if (!isRecord(payload)) {
    throw new Error("Token invalido");
  }

  if (payload.context === "PLATFORM") {
    if (!isPositiveInteger(payload.idUser) || !isPositiveInteger(payload.idLogin)) {
      throw new Error("Token invalido");
    }

    return {
      context: "PLATFORM",
      idUser: payload.idUser,
      idLogin: payload.idLogin,
    };
  }

  if (payload.context === "BUSINESS") {
    if (
      !isPositiveInteger(payload.idUser) ||
      !isPositiveInteger(payload.idBusiness) ||
      !isPositiveInteger(payload.idLogin)
    ) {
      throw new Error("Token invalido");
    }

    return {
      context: "BUSINESS",
      idUser: payload.idUser,
      idBusiness: payload.idBusiness,
      idLogin: payload.idLogin,
    };
  }

  throw new Error("Token invalido");
}

export function signAccessToken(payload: AccessTokenInput): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(payload: RefreshTokenInput): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return normalizeVerifiedAccessPayload(jwt.verify(token, ACCESS_SECRET));
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return normalizeVerifiedRefreshPayload(jwt.verify(token, REFRESH_SECRET));
}
