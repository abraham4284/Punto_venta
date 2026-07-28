import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  cancelPurchaseController,
  createPurchaseController,
  getPurchaseByIdController,
  getPurchasesController,
} from "../controllers/purchases.controller.js";

const router = Router();

router.post(
  "/purchases",
  requireAuth,
  requirePermission("purchases.create"),
  createPurchaseController,
);
router.get(
  "/purchases",
  requireAuth,
  requirePermission("purchases.view"),
  getPurchasesController,
);
router.get(
  "/purchases/:id",
  requireAuth,
  requirePermission("purchases.view"),
  getPurchaseByIdController,
);
router.patch(
  "/purchases/:id/cancel",
  requireAuth,
  requirePermission("purchases.cancel"),
  cancelPurchaseController,
);

export default router;
