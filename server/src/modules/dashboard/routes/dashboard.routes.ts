import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { getDashboardDataController } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/dashboard/metrics", requireAuth, getDashboardDataController);

export default router;
