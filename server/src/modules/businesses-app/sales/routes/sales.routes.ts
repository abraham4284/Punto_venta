import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  cancelSaleController,
  createSaleController,
  getDeliveryUsersForSaleController,
  getProductsWithStockByDepositController,
  getSaleByIdController,
  getSalesController,
} from "../controllers/sales.controller.js";

const router = Router();

router.post(
  "/sales",
  requireAuth,
  requirePermission("sales.create"),
  createSaleController,
);
router.get("/sales", requireAuth, requirePermission("sales.view"), getSalesController);
router.get(
  "/sales/products-by-deposit/:idDeposit",
  requireAuth,
  requirePermission("sales.create"),
  getProductsWithStockByDepositController,
);
router.get(
  "/sales/delivery-users",
  requireAuth,
  requirePermission("sales.create"),
  getDeliveryUsersForSaleController,
);
router.get("/sales/:id", requireAuth, requirePermission("sales.view"), getSaleByIdController);
router.patch(
  "/sales/:id/cancel",
  requireAuth,
  requirePermission("sales.cancel"),
  cancelSaleController,
);

export default router;
