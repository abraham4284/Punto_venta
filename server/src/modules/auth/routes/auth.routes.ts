import { Router } from "express";
import { validateSchema } from "../middleware/validateSchema.js";
import { requireAuth } from "@/middlewares/requireAuth.js";
import {
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  getUserInfoByIdController,
  me,
} from "../controllers/auth.controller.js";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validations.js";

const router = Router();

router.post("/register", validateSchema(registerSchema), registerController);
router.post("/login", validateSchema(loginSchema), loginController);
router.post("/refresh", refreshTokenController);
router.post("/logout", requireAuth, logoutController);
router.get("/me", requireAuth, me);
router.get("/auth/user-info/:idUser", requireAuth, getUserInfoByIdController);

export default router;
