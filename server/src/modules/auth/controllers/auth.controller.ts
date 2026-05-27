import type { Request, Response, NextFunction } from "express";
import { setAuthCookies, clearAuthCookies } from "@/libs/cookies.js";
import {
  loginService,
  registerService,
  refreshTokenService,
  logoutService,
} from "../services/auth.service.js";
import type { LoginBody, RegisterBody } from "../types/auth.types.js";

export const registerController = async (
  req: Request<object, object, RegisterBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await registerService(req.body);

    res.status(201).json({
      status: "OK",
      message: "Usuario y negocio registrados correctamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request<object, object, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await loginService(
      req.body,
      req.headers["user-agent"],
      req.ip,
    );
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      status: "OK",
      message: "Login correcto",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      res.status(401).json({
        status: "ERROR",
        message: "Refresh token requerido",
      });
      return;
    }

    const result = await refreshTokenService(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      status: "OK",
      message: "Token renovado correctamente",
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    await logoutService(refreshToken);

    clearAuthCookies(res);

    res.status(200).json({
      status: "OK",
      message: "Sesion cerrada correctamente",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const me = (req: Request, res: Response): void => {
  res.status(200).json({
    status: "OK",
    message: "Usuario autenticado",
    data: {
      user: req.user,
    },
  });
};
