import type { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_MAX_AGE_MS = 1 * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  res.clearCookie("refresh_token", {
    ...baseCookieOptions,
    path: "/auth",
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseCookieOptions,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("access_token", {
    ...baseCookieOptions,
    path: "/",
  });
  res.clearCookie("refresh_token", {
    ...baseCookieOptions,
    path: "/",
  });
  res.clearCookie("refresh_token", {
    ...baseCookieOptions,
    path: "/auth",
  });
};
