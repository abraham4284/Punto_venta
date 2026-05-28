import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
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

router.get("/deposits", requireAuth, getDepositsController);
router.get(
  "/deposits/:idDeposit",
  requireAuth,
  validateParams(depositIdParamSchema),
  getDepositByIdController,
);
router.post(
  "/deposits",
  requireAuth,
  validateBody(createDepositSchema),
  createDepositController,
);
router.patch(
  "/deposits/:idDeposit",
  requireAuth,
  validateParams(depositIdParamSchema),
  validateBody(updateDepositSchema),
  updateDepositController,
);

export default router;
