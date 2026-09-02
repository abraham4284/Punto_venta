import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createInitialStockController,
  getAdvancedStockInventoryController,
  getCriticalStockReportController,
  getStockBalanceController,
  getStockByIdController,
  getStockController,
  searchProductsForStockController,
} from "../controllers/stock.controller.js";

const router = Router();

router.get("/stock", requireAuth, requirePermission("stock.view"), getStockController);
router.get(
  "/stock/advanced-search",
  requireAuth,
  requirePermission("stock.view"),
  getAdvancedStockInventoryController,
);
router.get(
  "/stock/report/critical",
  requireAuth,
  requirePermission("stock.view_critical"),
  getCriticalStockReportController,
);
router.get(
  "/stock/products/search",
  requireAuth,
  requirePermission("stock.adjust"),
  searchProductsForStockController,
);
router.get("/stock/balance", requireAuth, requirePermission("stock.view"), getStockBalanceController);
router.get("/stock/:id", requireAuth, requirePermission("stock.view"), getStockByIdController);
router.post("/stock", requireAuth, requirePermission("stock.adjust"), createInitialStockController);

export default router;
