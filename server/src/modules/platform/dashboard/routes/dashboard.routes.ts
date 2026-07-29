import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import { requirePlatformRoles } from "@/middlewares/requirePlatformRoles.middleware.js";
import { getPlatformDashboardController } from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  requirePlatformContext,
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  getPlatformDashboardController,
);

export default router;
