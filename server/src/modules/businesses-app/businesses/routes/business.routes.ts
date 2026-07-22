import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { validateSchema } from "../../auth/middleware/validateSchema.js";
import {
  getBusinessController,
  updateBusinessController,
} from "../controllers/business.controller.js";
import { updateBusinessSchema } from "../validations/business.validations.js";

const router = Router();

router.get("/businesses", requireAuth, getBusinessController);
router.patch(
  "/businesses/me",
  requireAuth,
  validateSchema(updateBusinessSchema),
  updateBusinessController,
);

export default router;
