import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { setAuthCookies, clearAuthCookies } from "@/libs/cookies.js";
import {
  getUserInfoByIdService,
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
  updatePasswordService,
} from "../services/auth.service.js";
import type {
  LoginBody,
  RegisterBody,
  UpdatePasswordBody,
} from "../types/auth.types.js";
import { updatePasswordSchema } from "../validations/auth.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export async function registerController(
  req: Request<object, object, RegisterBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
}

export async function loginController(
  req: Request<object, object, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
}

export async function refreshTokenController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
}

export function me(req: Request, res: Response): void {
  res.status(200).json({
    status: "OK",
    message: "Usuario autenticado",
    data: req.user,
  });
}

export async function getUserInfoByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idUser = Number(req.params.idUser);

    if (!Number.isInteger(idUser) || idUser <= 0) {
      return res.status(400).json({
        status: false,
        message: "El identificador del usuario debe ser valido",
      });
    }

    const result = await getUserInfoByIdService(
      idUser,
      req.user!.idBusiness,
    );

    return res.status(200).json({
      status: true,
      message: "Informacion del usuario obtenida correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function updatePasswordController(
  req: Request<{ idUser: string }, object, UpdatePasswordBody>,
  res: Response,
): Promise<Response> {
  try {
    const idUser = Number(req.params.idUser);

    if (!Number.isInteger(idUser) || idUser <= 0) {
      return res.status(400).json({
        status: false,
        message: "El identificador del usuario debe ser valido",
      });
    }

    const data = updatePasswordSchema.parse(req.body);
    const result = await updatePasswordService(
      idUser,
      req.user!.idBusiness,
      data.password,
    );

    return res.status(200).json({
      status: true,
      message: "Contrasena actualizada correctamente",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}
