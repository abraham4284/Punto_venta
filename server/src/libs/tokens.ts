import jwt from "jsonwebtoken";
import type { UserRole } from "@/modules/businesses-app/auth/types/auth.types.js";

export interface AccessTokenPayload {
  idUser: number;
  idBusiness: number;
  role: UserRole;
}

export interface RefreshTokenPayload {
  idUser: number;
  idBusiness?: number;
  idLogin: number;
}

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET is required");
}

if (!REFRESH_SECRET) {
  throw new Error("REFRESH_TOKEN_SECRET is required");
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
};
