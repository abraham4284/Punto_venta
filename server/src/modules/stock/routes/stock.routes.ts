import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  createInitialStockController,
  getAdvancedStockInventoryController,
  getCriticalStockReportController,
  getStockBalanceController,
  getStockByIdController,
  getStockController,
} from "../controllers/stock.controller.js";

const router = Router();

router.get("/stock", requireAuth, getStockController);
router.get("/stock/advanced-search", requireAuth, getAdvancedStockInventoryController);
router.get("/stock/report/critical", requireAuth, getCriticalStockReportController);
router.get("/stock/balance", requireAuth, getStockBalanceController);
router.get("/stock/:id", requireAuth, getStockByIdController);
router.post("/stock", requireAuth, createInitialStockController);

export default router;
