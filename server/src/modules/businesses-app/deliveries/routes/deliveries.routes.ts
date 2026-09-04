import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  assignDeliveryController,
  changeDeliveryStatusController,
  getDeliveryByIdController,
  listDeliveriesController,
} from "../controllers/deliveries.controller.js";
import type { DeliveryStatus } from "../types/index.js";

const router = Router();

function setDeliveryStatus(status: DeliveryStatus) {
  return function setDeliveryStatusMiddleware(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    res.locals.deliveryStatus = status;
    next();
  };
}

router.get(
  "/deliveries",
  requireAuth,
  requirePermission("deliveries.view"),
  listDeliveriesController,
);
router.get(
  "/deliveries/:id",
  requireAuth,
  requirePermission("deliveries.view"),
  getDeliveryByIdController,
);
router.patch(
  "/deliveries/:id/assign",
  requireAuth,
  requirePermission("deliveries.assign"),
  assignDeliveryController,
);
router.patch(
  "/deliveries/:id/start",
  requireAuth,
  requirePermission("deliveries.update_status"),
  setDeliveryStatus("OUT_FOR_DELIVERY"),
  changeDeliveryStatusController,
);
router.patch(
  "/deliveries/:id/fail",
  requireAuth,
  requirePermission("deliveries.update_status"),
  setDeliveryStatus("FAILED"),
  changeDeliveryStatusController,
);
router.patch(
  "/deliveries/:id/reschedule",
  requireAuth,
  requirePermission("deliveries.update_status"),
  setDeliveryStatus("PENDING"),
  changeDeliveryStatusController,
);
router.patch(
  "/deliveries/:id/deliver",
  requireAuth,
  requirePermission("deliveries.update_status"),
  setDeliveryStatus("DELIVERED"),
  changeDeliveryStatusController,
);
router.patch(
  "/deliveries/:id/cancel",
  requireAuth,
  requirePermission("deliveries.update_status"),
  setDeliveryStatus("CANCELLED"),
  changeDeliveryStatusController,
);

export default router;
