import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requireBusinessContext } from "@/middlewares/requireBusinessContext.middleware.js";
import { getBusinessCurrentSubscriptionController } from "../controllers/business-subscription.controller.js";

const router = Router();

router.get(
  "/business/subscription",
  requireAuth,
  requireBusinessContext,
  getBusinessCurrentSubscriptionController,
);

export default router;
