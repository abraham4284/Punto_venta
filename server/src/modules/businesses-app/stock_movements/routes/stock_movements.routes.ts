import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  getStockMovementsController,
  processStockAdjustmentController,
  processStockTransferController,
} from "../controllers/stock_movements.controller.js";

const router = Router();

router.get(
  "/stock-movements",
  requireAuth,
  requirePermission("stock.view_movements"),
  getStockMovementsController,
);
router.post(
  "/stock-movements/adjust",
  requireAuth,
  requirePermission("stock.adjust"),
  processStockAdjustmentController,
);
router.post(
  "/stock-movements/transfer",
  requireAuth,
  requirePermission("stock.transfer"),
  processStockTransferController,
);

export default router;
