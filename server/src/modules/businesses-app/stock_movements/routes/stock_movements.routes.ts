import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  getStockMovementsController,
  processStockAdjustmentController,
  processStockTransferController,
} from "../controllers/stock_movements.controller.js";

const router = Router();

router.get("/stock-movements", requireAuth, getStockMovementsController);
router.post(
  "/stock-movements/adjust",
  requireAuth,
  processStockAdjustmentController,
);
router.post(
  "/stock-movements/transfer",
  requireAuth,
  processStockTransferController,
);

export default router;
