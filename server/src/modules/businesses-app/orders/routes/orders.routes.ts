import { Router } from "express";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import {
  convertOrderController,
  cancelOrderController,
  createOrderController,
  getOrderController,
  listOrdersController,
  orderEventsController,
  orderProductsController,
  orderStatusController,
  updateOrderController,
} from "../controllers/orders.controller.js";

const router = Router();
router.post(
  "/orders/:id/convert-to-sale",
  requirePermission("orders.convert"),
  requirePermission("sales.create"),
  convertOrderController,
);
router.post(
  "/orders",
  requirePermission("orders.create"),
  createOrderController,
);
router.get("/orders", requirePermission("orders.view"), listOrdersController);
router.get(
  "/orders/products-by-deposit/:idDeposit",
  requirePermission("orders.view"),
  orderProductsController,
);
router.get(
  "/orders/:id/events",
  requirePermission("orders.view"),
  orderEventsController,
);
router.get("/orders/:id", requirePermission("orders.view"), getOrderController);
router.put(
  "/orders/:id",
  requirePermission("orders.update"),
  updateOrderController,
);
router.patch(
  "/orders/:id/status",
  requirePermission("orders.change_status"),
  orderStatusController,
);
router.patch(
  "/orders/:id/cancel",
  requirePermission("orders.cancel"),
  cancelOrderController,
);
export default router;
