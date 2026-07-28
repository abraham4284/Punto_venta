import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import { getSaleTicketController } from "../controllers/tickets.controller.js";

const router = Router();

router.get(
  "/tickets/sale/:idSale",
  requireAuth,
  requirePermission("sales.view"),
  getSaleTicketController,
);

export default router;
