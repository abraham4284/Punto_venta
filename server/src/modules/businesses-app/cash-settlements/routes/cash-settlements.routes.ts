import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createCashSettlementController,
  getCashSettlementByIdController,
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
