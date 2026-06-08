import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  createInitialStockController,
  getStockByIdController,
  getStockController,
} from "../controllers/stock.controller.js";

const router = Router();

router.get("/stock", requireAuth, getStockController);
router.get("/stock/:id", requireAuth, getStockByIdController);
router.post("/stock", requireAuth, createInitialStockController);

export default router;
