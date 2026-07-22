import type { Request, Response } from "express";
import { z } from "zod";
import { clearAuthCookies, setAuthCookies } from "@/libs/cookies.js";
import {
  bootstrapPlatformAdminService,
  createPlatformUserService,
  getPlatformMeService,
  loginPlatformService,
  logoutPlatformService,
  refreshPlatformTokenService,
} from "../services/platformAuth.service.js";
import {
  platformBootstrapSchema,
  platformLoginSchema,
} from "../validations/platformAuth.schema.js";
import type { PlatformServiceError } from "../types.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function isPlatformServiceError(error: unknown): error is PlatformServiceError {
  return error instanceof Error && "statusCode" in error;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Error interno del servidor";
}

function getErrorStatus(error: unknown): number {
  if (isPlatformServiceError(error)) {
    return error.statusCode;
  }

  return 400;
}

export async function bootstrapPlatformController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    if (process.env.PLATFORM_BOOTSTRAP_ENABLED !== "true") {
      return res.status(404).json({
        success: false,
        message: "Recurso no encontrado",
        data: null,
      });
    }

    const bootstrapSecret = req.headers["x-bootstrap-secret"];

    if (
      typeof bootstrapSecret !== "string" ||
      bootstrapSecret !== process.env.PLATFORM_BOOTSTRAP_SECRET
    ) {
      return res.status(401).json({
        success: false,
        message: "No autorizado",
        data: null,
      });
    }

    const data = platformBootstrapSchema.parse(req.body);
    const result = await bootstrapPlatformAdminService(data);

    return res.status(201).json({
      success: true,
      message: "Usuario de plataforma creado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error),
      data: null,
    });
  }
}

export async function loginPlatformController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = platformLoginSchema.parse(req.body);
    const result = await loginPlatformService(
      data,
      req.headers["user-agent"],
      req.ip,
    );

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login de plataforma correcto",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(401).json({
      success: false,
      message: "Credenciales invalidas",
      data: null,
    });
  }
}

export async function refreshPlatformController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token requerido",
        data: null,
      });
    }

    const result = await refreshPlatformTokenService(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token de plataforma renovado correctamente",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: "Sesion invalida o expirada",
      data: null,
    });
  }
}

export async function logoutPlatformController(
  req: Request,
  res: Response,
): Promise<Response> {
  const refreshToken = req.cookies?.refresh_token as string | undefined;

  await logoutPlatformService(refreshToken);
  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Sesion de plataforma cerrada correctamente",
    data: null,
  });
}

export async function getPlatformMeController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    if (req.auth?.context !== "PLATFORM") {
      return res.status(403).json({
        success: false,
        message: "Acceso permitido solo para plataforma",
        data: null,
      });
    }

    const result = await getPlatformMeService(req.auth.idUser);

    return res.status(200).json({
      success: true,
      message: "Usuario de plataforma autenticado",
      data: result,
    });
  } catch (error: unknown) {
    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error),
      data: null,
    });
  }
}

export async function createPlatformUserController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = platformBootstrapSchema.parse(req.body);
    const result = await createPlatformUserService(data);

    return res.status(201).json({
      success: true,
      message: "Usuario de plataforma creado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error),
      data: null,
    });
  }
}
