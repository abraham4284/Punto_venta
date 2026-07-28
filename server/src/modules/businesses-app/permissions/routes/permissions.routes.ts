import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  getGroupedPermissionsController,
  getPermissionsController,
} from "../controllers/permissions.controller.js";

const router = Router();

router.get(
  "/permissions",
  requireAuth,
  requirePermission("users.manage_permissions"),
  getPermissionsController,
);
router.get(
  "/permissions/grouped",
  requireAuth,
  requirePermission("users.manage_permissions"),
  getGroupedPermissionsController,
);

export default router;
