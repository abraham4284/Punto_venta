import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import { getDashboardDataController } from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
  "/dashboard/metrics",
  requireAuth,
  requirePermission("dashboard.view"),
  getDashboardDataController,
);

export default router;
