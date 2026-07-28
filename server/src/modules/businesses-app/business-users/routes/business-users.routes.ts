import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  changeBusinessUserRoleController,
  changeBusinessUserStatusController,
  createBusinessUserController,
  getBusinessUserByIdController,
  getBusinessUserPermissionsController,
  listBusinessUsersController,
  resetBusinessUserPermissionsController,
  updateBusinessUserController,
  updateBusinessUserPermissionsController,
} from "../controllers/business-users.controller.js";

const router = Router();

router.get(
  "/business-users",
  requireAuth,
  requirePermission("users.view"),
  listBusinessUsersController,
);
router.get(
  "/business-users/:idUser",
  requireAuth,
  requirePermission("users.view"),
  getBusinessUserByIdController,
);
router.post(
  "/business-users",
  requireAuth,
  requirePermission("users.create"),
  createBusinessUserController,
);
router.patch(
  "/business-users/:idUser",
  requireAuth,
  requirePermission("users.update"),
  updateBusinessUserController,
);
router.patch(
  "/business-users/:idUser/role",
  requireAuth,
  requirePermission("users.change_role"),
  changeBusinessUserRoleController,
);
router.patch(
  "/business-users/:idUser/status",
  requireAuth,
  requirePermission("users.change_status"),
  changeBusinessUserStatusController,
);
router.get(
  "/business-users/:idUser/permissions",
  requireAuth,
  requirePermission("users.manage_permissions"),
  getBusinessUserPermissionsController,
);
router.put(
  "/business-users/:idUser/permissions",
  requireAuth,
  requirePermission("users.manage_permissions"),
  updateBusinessUserPermissionsController,
);
router.delete(
  "/business-users/:idUser/permissions",
  requireAuth,
  requirePermission("users.manage_permissions"),
  resetBusinessUserPermissionsController,
);

export default router;
