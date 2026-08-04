import { Router } from "express";
import {
  platformLoginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from "@/middlewares/rate-limit/rate-limit.middleware.js";
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

router.post("/auth/bootstrap", registerRateLimiter, bootstrapPlatformController);
router.post(
  "/auth/base-user",
  registerRateLimiter,
  createPlatformBaseUserController,
);
router.post("/auth/login", platformLoginRateLimiter, loginPlatformController);
router.post("/auth/refresh", refreshRateLimiter, refreshPlatformController);
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
