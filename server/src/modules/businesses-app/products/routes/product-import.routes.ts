import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  confirmProductImportController,
  downloadProductImportTemplateController,
  previewProductImportController,
} from "../controllers/product-import.controller.js";
import { productImportUploadMiddleware } from "../middlewares/product-import-upload.middleware.js";

const router = Router();

router.get(
  "/products/import/template",
  requireAuth,
  downloadProductImportTemplateController,
);
router.post(
  "/products/import/preview",
  requireAuth,
  productImportUploadMiddleware,
  previewProductImportController,
);
router.post(
  "/products/import/confirm",
  requireAuth,
  confirmProductImportController,
);

export default router;
