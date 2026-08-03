import { Router } from "express";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  closeCashSessionController,
  getCashSessionByIdController,
  getCashSessionSummaryController,
  getCurrentCashSessionController,
  listCashSessionPaymentSummariesController,
  listCashSessionsController,
  openCashSessionController,
} from "../controllers/cash-sessions.controller.js";

const router = Router();

router.post(
  "/cash-sessions/open",
  requirePermission("cash_sessions.open"),
  openCashSessionController,
);
router.get(
  "/cash-sessions/current",
  requirePermission("cash_sessions.view"),
  getCurrentCashSessionController,
);
router.get(
  "/cash-sessions",
  requirePermission("cash_sessions.view_history"),
  listCashSessionsController,
);
router.get(
  "/cash-sessions/:idCashSession",
  requirePermission("cash_sessions.view"),
  getCashSessionByIdController,
);
router.get(
  "/cash-sessions/:idCashSession/summary",
  requirePermission("cash_sessions.view"),
  getCashSessionSummaryController,
);
router.post(
  "/cash-sessions/:idCashSession/close",
  requirePermission("cash_sessions.close"),
  closeCashSessionController,
);
router.get(
  "/cash-sessions/:idCashSession/payment-summaries",
  requirePermission("cash_reports.view"),
  listCashSessionPaymentSummariesController,
);

export default router;
