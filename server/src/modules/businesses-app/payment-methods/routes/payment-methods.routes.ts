import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  changePaymentMethodStatusController,
  createPaymentMethodController,
  getPaymentMethodByIdController,
  listPaymentMethodsController,
  setDefaultPaymentMethodController,
  updatePaymentMethodController,
} from "../controllers/payment-methods.controller.js";

const router = Router();

router.get(
  "/payment-methods",
  requireAuth,
  requirePermission("payment_methods.view"),
  listPaymentMethodsController,
);
router.get(
  "/payment-methods/:idPaymentMethod",
  requireAuth,
  requirePermission("payment_methods.view"),
  getPaymentMethodByIdController,
);
router.post(
  "/payment-methods",
  requireAuth,
  requirePermission("payment_methods.create"),
  createPaymentMethodController,
);
router.patch(
  "/payment-methods/:idPaymentMethod",
  requireAuth,
  requirePermission("payment_methods.update"),
  updatePaymentMethodController,
);
router.patch(
  "/payment-methods/:idPaymentMethod/status",
  requireAuth,
  requirePermission("payment_methods.change_status"),
  changePaymentMethodStatusController,
);
router.patch(
  "/payment-methods/:idPaymentMethod/default",
  requireAuth,
  requirePermission("payment_methods.set_default"),
  setDefaultPaymentMethodController,
);

export default router;
