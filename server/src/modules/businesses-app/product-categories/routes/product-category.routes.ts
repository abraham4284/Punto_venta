import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
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

router.get("/product-categories", requireAuth, getProductCategoriesController);
router.get(
  "/product-categories/:idProductCategory",
  requireAuth,
  validateParams(productCategoryIdParamSchema),
  getProductCategoryByIdController,
);
router.post(
  "/product-categories",
  requireAuth,
  validateBody(createProductCategorySchema),
  createProductCategoryController,
);
router.patch(
  "/product-categories/:idProductCategory",
  requireAuth,
  validateParams(productCategoryIdParamSchema),
  validateBody(updateProductCategorySchema),
  updateProductCategoryController,
);
router.patch(
  "/product-categories/:idProductCategory/status",
  requireAuth,
  validateParams(productCategoryIdParamSchema),
  validateBody(updateProductCategoryStatusSchema),
  updateProductCategoryStatusController,
);

export default router;
