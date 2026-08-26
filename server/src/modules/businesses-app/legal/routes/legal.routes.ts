import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requireBusinessContext } from "@/middlewares/requireBusinessContext.middleware.js";
import {
  getCurrentLegalDocumentController,
  getCurrentLegalDocumentsController,
  getLegalDocumentVersionController,
  getMyLegalAcceptancesController,
  recordLegalAcceptanceController,
} from "../controllers/legal.controller.js";

const router = Router();

router.get("/legal/documents/current", getCurrentLegalDocumentsController);
router.get("/legal/documents/:code/current", getCurrentLegalDocumentController);
router.get(
  "/legal/documents/:code/versions/:version",
  getLegalDocumentVersionController,
);

router.get(
  "/legal/acceptances/me",
  requireAuth,
  requireBusinessContext,
  getMyLegalAcceptancesController,
);
router.post(
  "/legal/acceptances",
  requireAuth,
  requireBusinessContext,
  recordLegalAcceptanceController,
);

export default router;
