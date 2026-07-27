import jwt from "jsonwebtoken";
import type {
  AccessTokenInput,
  AccessTokenPayload,
  BusinessAccessTokenPayload,
  BusinessRefreshTokenPayload,
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

function normalizeAccessPayload(payload: AccessTokenInput): AccessTokenPayload {
  if ("context" in payload) {
    return payload;
  }

  return {
    context: "BUSINESS",
    idUser: payload.idUser,
    idBusiness: payload.idBusiness,
    businessRole: payload.role,
  };
}

function normalizeRefreshPayload(payload: RefreshTokenInput): RefreshTokenPayload {
  if ("context" in payload) {
    return payload;
  }

  return {
    context: "BUSINESS",
    idUser: payload.idUser,
    idBusiness: payload.idBusiness,
    idLogin: payload.idLogin,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeVerifiedAccessPayload(payload: unknown): AccessTokenPayload {
  if (!isRecord(payload)) {
    throw new Error("Token invalido");
  }

  if (payload.context === "PLATFORM") {
    return payload as unknown as AccessTokenPayload;
  }

  if (payload.context === "BUSINESS") {
    return payload as unknown as AccessTokenPayload;
  }

  return {
    context: "BUSINESS",
    idUser: Number(payload.idUser),
    idBusiness: Number(payload.idBusiness),
    businessRole: payload.role as BusinessAccessTokenPayload["businessRole"],
  };
}

function normalizeVerifiedRefreshPayload(payload: unknown): RefreshTokenPayload {
  if (!isRecord(payload)) {
    throw new Error("Token invalido");
  }

  if (payload.context === "PLATFORM") {
    return payload as unknown as RefreshTokenPayload;
  }

  if (payload.context === "BUSINESS") {
    return payload as unknown as RefreshTokenPayload;
  }

  return {
    context: "BUSINESS",
    idUser: Number(payload.idUser),
    idBusiness: Number(payload.idBusiness),
    idLogin: Number(payload.idLogin),
  } satisfies BusinessRefreshTokenPayload;
}

export function signAccessToken(payload: AccessTokenInput): string {
  return jwt.sign(normalizeAccessPayload(payload), ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(payload: RefreshTokenInput): string {
  return jwt.sign(normalizeRefreshPayload(payload), REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return normalizeVerifiedAccessPayload(jwt.verify(token, ACCESS_SECRET));
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return normalizeVerifiedRefreshPayload(jwt.verify(token, REFRESH_SECRET));
}
