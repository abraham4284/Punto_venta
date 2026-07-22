import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  cancelPurchaseController,
  createPurchaseController,
  getPurchaseByIdController,
  getPurchasesController,
} from "../controllers/purchases.controller.js";

const router = Router();

router.post("/purchases", requireAuth, createPurchaseController);
router.get("/purchases", requireAuth, getPurchasesController);
router.get("/purchases/:id", requireAuth, getPurchaseByIdController);
router.patch("/purchases/:id/cancel", requireAuth, cancelPurchaseController);

export default router;
