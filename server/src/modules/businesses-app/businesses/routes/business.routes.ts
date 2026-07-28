import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePermission } from "@/middlewares/requirePermission.middleware.js";
import { validateSchema } from "../../auth/middleware/validateSchema.js";
import {
  getBusinessController,
  updateBusinessController,
} from "../controllers/business.controller.js";
import { updateBusinessSchema } from "../validations/business.validations.js";

const router = Router();

router.get("/businesses", requireAuth, requirePermission("business.view"), getBusinessController);
router.patch(
  "/businesses/me",
  requireAuth,
  requirePermission("business.update"),
  validateSchema(updateBusinessSchema),
  updateBusinessController,
);

export default router;
