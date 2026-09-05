import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  cancelSalePaymentController,
  collectSalePaymentController,
  confirmSalePaymentController,
  createSalePaymentController,
  listSalePaymentsController,
  updateSalePaymentController,
} from "../controllers/sale-payments.controller.js";

const router = Router();

router.get(
  "/sales/:idSale/payments",
  requireAuth,
  requirePermission("sale_payments.view"),
  listSalePaymentsController,
);

router.post(
  "/sales/:idSale/payments",
  requireAuth,
  requirePermission("sale_payments.create"),
  createSalePaymentController,
);

router.patch(
  "/sale-payments/:idSalePayment",
  requireAuth,
  requirePermission("sale_payments.update"),
  updateSalePaymentController,
);

router.patch(
  "/sale-payments/:idSalePayment/cancel",
  requireAuth,
  requirePermission("sale_payments.cancel"),
  cancelSalePaymentController,
);

router.patch(
  "/sale-payments/:idSalePayment/collect",
  requireAuth,
  requirePermission("sale_payments.collect"),
  collectSalePaymentController,
);

router.patch(
  "/sale-payments/:idSalePayment/confirm",
  requireAuth,
  requirePermission("sale_payments.confirm"),
  confirmSalePaymentController,
);

export default router;
