import { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import { requirePlatformRoles } from "@/middlewares/requirePlatformRoles.middleware.js";
import {
  getPlatformAuditLogByIdController,
  listPlatformAuditLogsController,
} from "../controllers/audit.controller.js";

const router = Router();

function skipUnmatchedAuditRoutes(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.path.startsWith("/audit-logs")) {
    next("router");
    return;
  }

  next();
}

router.use(skipUnmatchedAuditRoutes);
router.use(requireAuth, requirePlatformContext);

router.get(
  "/audit-logs",
  requirePlatformRoles(["SUPER_ADMIN", "ANALYST"]),
  listPlatformAuditLogsController,
);

router.get(
  "/audit-logs/:idPlatformAuditLog",
  requirePlatformRoles(["SUPER_ADMIN", "ANALYST"]),
  getPlatformAuditLogByIdController,
);

export default router;
