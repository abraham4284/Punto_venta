import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createDepositController,
  getDepositByIdController,
  getDepositsController,
  updateDepositController,
} from "../controllers/deposit.controller.js";
import {
  createDepositSchema,
  depositIdParamSchema,
  updateDepositSchema,
} from "../validations/deposit.validations.js";
import { validateBody, validateParams } from "../helpers/validateRequest.js";

const router = Router();

router.get("/deposits", requireAuth, requirePermission("deposits.view"), getDepositsController);
router.get(
  "/deposits/:idDeposit",
  requireAuth,
  requirePermission("deposits.view"),
  validateParams(depositIdParamSchema),
  getDepositByIdController,
);
router.post(
  "/deposits",
  requireAuth,
  requirePermission("deposits.create"),
  validateBody(createDepositSchema),
  createDepositController,
);
router.patch(
  "/deposits/:idDeposit",
  requireAuth,
  requirePermission("deposits.update"),
  validateParams(depositIdParamSchema),
  validateBody(updateDepositSchema),
  updateDepositController,
);

export default router;
