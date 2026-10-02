import { Router } from "express";
import {
  getPublicCatalogCategoriesController,
  getPublicCatalogController,
  getPublicCatalogProductBySlugController,
  getPublicCatalogProductsController,
} from "../controllers/catalog.controller.js";

const router = Router();

router.get("/catalog", getPublicCatalogController);
router.get("/catalog/categories", getPublicCatalogCategoriesController);
router.get("/catalog/products", getPublicCatalogProductsController);
router.get("/catalog/products/:slug", getPublicCatalogProductBySlugController);

export default router;
