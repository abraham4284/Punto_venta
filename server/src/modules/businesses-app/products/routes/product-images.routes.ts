import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createProductImageController,
  deleteProductImageController,
  getProductImagesController,
  reorderProductImagesController,
} from "../controllers/product-images.controller.js";

const router = Router();

router.get(
  "/products/:idProduct/images",
  requireAuth,
  requirePermission("products.view"),
  getProductImagesController,
);

router.post(
  "/products/:idProduct/images",
  requireAuth,
  requirePermission("products.update"),
  createProductImageController,
);

router.patch(
  "/products/:idProduct/images/order",
  requireAuth,
  requirePermission("products.update"),
  reorderProductImagesController,
);

router.delete(
  "/products/:idProduct/images/:idProductImage",
  requireAuth,
  requirePermission("products.update"),
  deleteProductImageController,
);

export default router;
