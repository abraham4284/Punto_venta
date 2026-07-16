import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  createProductController,
  getProductByIdController,
  getProductsController,
  toggleProductStatusController,
  updateProductPricesController,
  updateProductController,
} from "../controllers/products.controller.js";

const router = Router();

router.post("/products", requireAuth, createProductController);
router.get("/products", requireAuth, getProductsController);
router.get("/products/:id", requireAuth, getProductByIdController);
router.put("/products/:id", requireAuth, updateProductController);
router.patch(
  "/products/:idProduct/prices",
  requireAuth,
  updateProductPricesController,
);
router.patch("/products/:id/status", requireAuth, toggleProductStatusController);

export default router;
