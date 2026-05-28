import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@/modules/auth/types/auth.types.js";

export const requireRoles =
  (allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: "ERROR",
        message: "Usuario no autenticado",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "ERROR",
        message: "No tienes permisos para realizar esta acción",
      });
      return;
    }

    next();
  };