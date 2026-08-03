import { Router } from "express";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createCashMovementController,
  listCashMovementsBySessionController,
} from "../controllers/cash-movements.controller.js";

const router = Router();

router.get(
  "/cash-sessions/:idCashSession/movements",
  requirePermission("cash_movements.view"),
  listCashMovementsBySessionController,
);
router.post(
  "/cash-sessions/:idCashSession/movements",
  requirePermission("cash_movements.create"),
  createCashMovementController,
);

export default router;
