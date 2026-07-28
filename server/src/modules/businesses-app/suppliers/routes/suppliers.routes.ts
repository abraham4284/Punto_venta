import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createSupplierController,
  getSupplierByIdController,
  getSuppliersController,
  updateSupplierController,
} from "../controllers/suppliers.controller.js";

const router = Router();

router.post(
  "/suppliers",
  requireAuth,
  requirePermission("suppliers.create"),
  createSupplierController,
);
router.get(
  "/suppliers",
  requireAuth,
  requirePermission("suppliers.view"),
  getSuppliersController,
);
router.get(
  "/suppliers/:id",
  requireAuth,
  requirePermission("suppliers.view"),
  getSupplierByIdController,
);
router.patch(
  "/suppliers/:id",
  requireAuth,
  requirePermission("suppliers.update"),
  updateSupplierController,
);

export default router;
