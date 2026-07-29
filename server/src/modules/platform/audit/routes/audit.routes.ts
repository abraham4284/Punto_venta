import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import { requirePlatformRoles } from "@/middlewares/requirePlatformRoles.middleware.js";
import {
  getPlatformAuditLogByIdController,
  listPlatformAuditLogsController,
} from "../controllers/audit.controller.js";

const router = Router();

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
