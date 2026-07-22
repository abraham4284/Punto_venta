import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  createCustomerController,
  getCustomerByIdController,
  getCustomersController,
  toggleCustomerStatusController,
  updateCustomerController,
} from "../controllers/customers.controller.js";

const router = Router();

router.post("/customers", requireAuth, createCustomerController);
router.get("/customers", requireAuth, getCustomersController);
router.get("/customers/:id", requireAuth, getCustomerByIdController);
router.put("/customers/:id", requireAuth, updateCustomerController);
router.patch("/customers/:id/status", requireAuth, toggleCustomerStatusController);

export default router;
