import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import { requirePlatformRoles } from "@/middlewares/requirePlatformRoles.middleware.js";
import {
  bootstrapPlatformController,
  createPlatformUserController,
  getPlatformMeController,
  loginPlatformController,
  logoutPlatformController,
  refreshPlatformController,
} from "../controllers/platformAuth.controller.js";

const router = Router();

router.post("/auth/bootstrap", bootstrapPlatformController);
router.post("/auth/login", loginPlatformController);
router.post("/auth/refresh", refreshPlatformController);
router.post(
  "/auth/logout",
  requireAuth,
  requirePlatformContext,
  logoutPlatformController,
);
router.get(
  "/auth/me",
  requireAuth,
  requirePlatformContext,
  getPlatformMeController,
);
router.post(
  "/users",
  requireAuth,
  requirePlatformContext,
  requirePlatformRoles(["SUPER_ADMIN"]),
  createPlatformUserController,
);

export default router;
