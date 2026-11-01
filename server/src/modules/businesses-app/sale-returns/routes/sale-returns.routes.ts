import { Router } from "express";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import { createSaleReturnController, getSaleReturnController, listSaleReturnsController } from "../controllers/sale-returns.controller.js";
const router = Router();
router.post("/sales/:idSale/returns", requirePermission("sale_returns.create"), createSaleReturnController);
router.get("/sales/:idSale/returns", requirePermission("sale_returns.view"), listSaleReturnsController);
router.get("/sale-returns/:idSaleReturn", requirePermission("sale_returns.view"), getSaleReturnController);
export default router;
