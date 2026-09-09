import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createCashSettlementController,
  getCashSettlementByIdController,
  getMyPendingCashSettlementController,
  getPendingCashSettlementsController,
  listCashSettlementsController,
} from "../controllers/cash-settlements.controller.js";

const router = Router();

router.get(
  "/cash-settlements",
  requireAuth,
  requirePermission("cash_settlements.view"),
  listCashSettlementsController,
);

router.get(
  "/cash-settlements/pending",
  requireAuth,
  requirePermission("cash_settlements.view"),
  getPendingCashSettlementsController,
);

router.get(
  "/cash-settlements/my-pending",
  requireAuth,
  requirePermission("sale_payments.collect"),
  getMyPendingCashSettlementController,
);

router.get(
  "/cash-settlements/:id",
  requireAuth,
  requirePermission("cash_settlements.view"),
  getCashSettlementByIdController,
);

router.post(
  "/cash-settlements",
  requireAuth,
  requirePermission("cash_settlements.create"),
  createCashSettlementController,
);

export default router;
