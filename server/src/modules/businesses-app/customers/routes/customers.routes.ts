import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  createCustomerController,
  getCustomerByIdController,
  getCustomersController,
  toggleCustomerStatusController,
  updateCustomerController,
} from "../controllers/customers.controller.js";

const router = Router();

router.post(
  "/customers",
  requireAuth,
  requirePermission("customers.create"),
  createCustomerController,
);
router.get(
  "/customers",
  requireAuth,
  requirePermission("customers.view"),
  getCustomersController,
);
router.get(
  "/customers/:id",
  requireAuth,
  requirePermission("customers.view"),
  getCustomerByIdController,
);
router.put(
  "/customers/:id",
  requireAuth,
  requirePermission("customers.update"),
  updateCustomerController,
);
router.patch(
  "/customers/:id/status",
  requireAuth,
  requirePermission("customers.change_status"),
  toggleCustomerStatusController,
);

export default router;
