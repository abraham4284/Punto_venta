import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import productImportRoutes from "./product-import.routes.js";
import {
  createProductController,
  getProductByIdController,
  getProductsController,
  toggleProductStatusController,
  updateProductPricesController,
  updateProductController,
} from "../controllers/products.controller.js";

const router = Router();

router.use(productImportRoutes);
router.post(
  "/products",
  requireAuth,
  requirePermission("products.create"),
  createProductController,
);
router.get(
  "/products",
  requireAuth,
  requirePermission("products.view"),
  getProductsController,
);
router.get(
  "/products/:id",
  requireAuth,
  requirePermission("products.view"),
  getProductByIdController,
);
router.put(
  "/products/:id",
  requireAuth,
  requirePermission("products.update"),
  updateProductController,
);
router.patch(
  "/products/:idProduct/prices",
  requireAuth,
  requirePermission("products.change_prices"),
  updateProductPricesController,
);
router.patch(
  "/products/:id/status",
  requireAuth,
  requirePermission("products.change_status"),
  toggleProductStatusController,
);

export default router;
