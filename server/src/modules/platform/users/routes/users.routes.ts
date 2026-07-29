import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import { requirePlatformRoles } from "@/middlewares/requirePlatformRoles.middleware.js";
import {
  changePlatformUserRoleController,
  changePlatformUserStatusController,
  createPlatformUserAdminController,
  getPlatformUserByIdController,
  listPlatformUsersController,
  revokePlatformUserSessionsController,
} from "../controllers/users.controller.js";

const router = Router();

router.use(requireAuth, requirePlatformContext, requirePlatformRoles(["SUPER_ADMIN"]));

router.get("/users", listPlatformUsersController);
router.get("/users/:idPlatformUser", getPlatformUserByIdController);
router.post("/users", createPlatformUserAdminController);
router.patch("/users/:idPlatformUser/role", changePlatformUserRoleController);
router.patch("/users/:idPlatformUser/status", changePlatformUserStatusController);
router.post(
  "/users/:idPlatformUser/revoke-sessions",
  revokePlatformUserSessionsController,
);

export default router;
