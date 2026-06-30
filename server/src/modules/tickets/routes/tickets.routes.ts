import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { getSaleTicketController } from "../controllers/tickets.controller.js";

const router = Router();

router.get("/tickets/sale/:idSale", requireAuth, getSaleTicketController);

export default router;
