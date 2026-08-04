import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { importRateLimiter } from "@/middlewares/rate-limit/rate-limit.middleware.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
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
  requirePermission("products.import"),
  downloadProductImportTemplateController,
);
router.post(
  "/products/import/preview",
  requireAuth,
  requirePermission("products.import"),
  importRateLimiter,
  productImportUploadMiddleware,
  previewProductImportController,
);
router.post(
  "/products/import/confirm",
  requireAuth,
  requirePermission("products.import"),
  importRateLimiter,
  confirmProductImportController,
);

export default router;
