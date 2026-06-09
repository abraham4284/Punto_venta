import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  cancelSaleController,
  createSaleController,
  getProductsWithStockByDepositController,
  getSaleByIdController,
  getSalesController,
} from "../controllers/sales.controller.js";

const router = Router();

router.post("/sales", requireAuth, createSaleController);
router.get("/sales", requireAuth, getSalesController);
router.get(
  "/sales/products-by-deposit/:idDeposit",
  requireAuth,
  getProductsWithStockByDepositController,
);
router.get("/sales/:id", requireAuth, getSaleByIdController);
router.patch("/sales/:id/cancel", requireAuth, cancelSaleController);

export default router;
