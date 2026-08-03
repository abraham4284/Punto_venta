import { Router } from "express";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  changeCashRegisterStatusController,
  createCashRegisterController,
  getCashRegisterByIdController,
  listCashRegistersController,
  setDefaultCashRegisterController,
  updateCashRegisterController,
} from "../controllers/cash-registers.controller.js";

const router = Router();

router.get(
  "/cash-registers",
  requirePermission("cash_registers.view"),
  listCashRegistersController,
);
router.get(
  "/cash-registers/:idCashRegister",
  requirePermission("cash_registers.view"),
  getCashRegisterByIdController,
);
router.post(
  "/cash-registers",
  requirePermission("cash_registers.create"),
  createCashRegisterController,
);
router.patch(
  "/cash-registers/:idCashRegister",
  requirePermission("cash_registers.update"),
  updateCashRegisterController,
);
router.patch(
  "/cash-registers/:idCashRegister/status",
  requirePermission("cash_registers.change_status"),
  changeCashRegisterStatusController,
);
router.patch(
  "/cash-registers/:idCashRegister/default",
  requirePermission("cash_registers.change_status"),
  setDefaultCashRegisterController,
);

export default router;
