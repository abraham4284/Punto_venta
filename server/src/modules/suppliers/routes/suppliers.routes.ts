import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  createSupplierController,
  getSupplierByIdController,
  getSuppliersController,
  updateSupplierController,
} from "../controllers/suppliers.controller.js";

const router = Router();

router.post("/suppliers", requireAuth, createSupplierController);
router.get("/suppliers", requireAuth, getSuppliersController);
router.get("/suppliers/:id", requireAuth, getSupplierByIdController);
router.patch("/suppliers/:id", requireAuth, updateSupplierController);

export default router;
