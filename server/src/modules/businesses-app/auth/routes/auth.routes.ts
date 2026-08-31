import { Router } from "express";
import {
  businessLoginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from "@/middlewares/rate-limit/rate-limit.middleware.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  getUserInfoByIdController,
  updatePasswordController,
  me,
} from "../controllers/auth.controller.js";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validations.js";

const router = Router();

router.post(
  "/register",
  registerRateLimiter,
  validateSchema(registerSchema),
  registerController,
);
router.post(
  "/login",
  businessLoginRateLimiter,
  validateSchema(loginSchema),
  loginController,
);
router.post("/refresh", refreshRateLimiter, refreshTokenController);
router.post("/logout", logoutController);
router.get("/me", requireAuth, me);
router.get("/auth/user-info/:idUser", requireAuth, getUserInfoByIdController);
router.patch(
  "/auth/update-password/:idUser",
  requireAuth,
  updatePasswordController,
);

export default router;
