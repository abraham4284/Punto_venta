import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createProductCategoryController,
  getProductCategoriesController,
  getProductCategoryByIdController,
  updateProductCategoryController,
  updateProductCategoryStatusController,
} from "../controllers/product-category.controller.js";
import {
  createProductCategorySchema,
  productCategoryIdParamSchema,
  updateProductCategorySchema,
  updateProductCategoryStatusSchema,
} from "../validations/product-category.validations.js";
import { validateBody, validateParams } from "../helpers/validateRequest.js";

const router = Router();

router.get(
  "/product-categories",
  requireAuth,
  requirePermission("categories.view"),
  getProductCategoriesController,
);
router.get(
  "/product-categories/:idProductCategory",
  requireAuth,
  requirePermission("categories.view"),
  validateParams(productCategoryIdParamSchema),
  getProductCategoryByIdController,
);
router.post(
  "/product-categories",
  requireAuth,
  requirePermission("categories.create"),
  validateBody(createProductCategorySchema),
  createProductCategoryController,
);
router.patch(
  "/product-categories/:idProductCategory",
  requireAuth,
  requirePermission("categories.update"),
  validateParams(productCategoryIdParamSchema),
  validateBody(updateProductCategorySchema),
  updateProductCategoryController,
);
router.patch(
  "/product-categories/:idProductCategory/status",
  requireAuth,
  requirePermission("categories.change_status"),
  validateParams(productCategoryIdParamSchema),
  validateBody(updateProductCategoryStatusSchema),
  updateProductCategoryStatusController,
);

export default router;
