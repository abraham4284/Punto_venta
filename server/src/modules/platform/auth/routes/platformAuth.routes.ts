import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import {
  bootstrapPlatformController,
  createPlatformBaseUserController,
  getPlatformMeController,
  loginPlatformController,
  logoutPlatformController,
  refreshPlatformController,
} from "../controllers/platformAuth.controller.js";

const router = Router();

router.post("/auth/bootstrap", bootstrapPlatformController);
router.post("/auth/base-user", createPlatformBaseUserController);
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
export default router;
