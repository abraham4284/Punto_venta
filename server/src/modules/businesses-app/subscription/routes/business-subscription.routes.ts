import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requireBusinessContext } from "@/middlewares/requireBusinessContext.middleware.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import { getBusinessCurrentSubscriptionController } from "../controllers/business-subscription.controller.js";

const router = Router();

router.get(
  "/business/subscription",
  requireAuth,
  requireBusinessContext,
  requirePermission("subscription.view"),
  getBusinessCurrentSubscriptionController,
);

export default router;
