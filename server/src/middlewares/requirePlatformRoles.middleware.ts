import type { NextFunction, Request, Response } from "express";
import type { PlatformRole } from "@/types/auth.types.js";

export function requirePlatformRoles(allowedRoles: PlatformRole[]) {
  return function requirePlatformRolesMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (req.auth?.context !== "PLATFORM") {
      res.status(403).json({
        success: false,
        message: "Acceso permitido solo para plataforma",
        data: null,
      });
      return;
    }

    if (!allowedRoles.includes(req.auth.platformRole)) {
      res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta accion",
        data: null,
      });
      return;
    }

    next();
  };
}
