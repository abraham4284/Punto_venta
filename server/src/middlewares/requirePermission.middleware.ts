import type { NextFunction, Request, Response } from "express";
import { userHasPermissionService } from "@/modules/businesses-app/permissions/services/permissions.service.js";

export function requirePermission(permissionCode: string) {
  return async function requirePermissionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (req.auth?.context !== "BUSINESS" || !req.user) {
      res.status(403).json({
        status: false,
        code: "BUSINESS_PERMISSION_REQUIRED",
        message: "No tenes permisos para realizar esta accion.",
        data: {
          requiredPermission: permissionCode,
        },
      });
      return;
    }

    if (req.user.role === "OWNER") {
      next();
      return;
    }

    try {
      const hasPermission = await userHasPermissionService(
        req.user.idBusiness,
        req.user.idUser,
        permissionCode,
      );

      if (!hasPermission) {
        res.status(403).json({
          status: false,
          code: "BUSINESS_PERMISSION_REQUIRED",
          message: "No tenes permisos para realizar esta accion.",
          data: {
            requiredPermission: permissionCode,
          },
        });
        return;
      }

      next();
    } catch {
      res.status(403).json({
        status: false,
        code: "BUSINESS_PERMISSION_REQUIRED",
        message: "No tenes permisos para realizar esta accion.",
        data: {
          requiredPermission: permissionCode,
        },
      });
    }
  };
}
