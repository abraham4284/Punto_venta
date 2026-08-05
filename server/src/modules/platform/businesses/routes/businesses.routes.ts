import { Router, type NextFunction, type Request, type Response } from "express";
import { passwordResetRateLimiter } from "@/middlewares/rate-limit/rate-limit.middleware.js";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import { requirePlatformRoles } from "@/middlewares/requirePlatformRoles.middleware.js";
import {
  changePlatformBusinessStatusController,
  getPlatformBusinessActivityController,
  getPlatformBusinessByIdController,
  getPlatformBusinessUsageController,
  listPlatformBusinessRecentPurchasesController,
  listPlatformBusinessRecentSalesController,
  listPlatformBusinessUsersController,
  listPlatformBusinessesController,
  resetPlatformBusinessUserPasswordController,
} from "../controllers/businesses.controller.js";

const router = Router();

function skipUnmatchedBusinessRoutes(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.path.startsWith("/businesses")) {
    next("router");
    return;
  }

  next();
}

router.use(skipUnmatchedBusinessRoutes);
router.use(requireAuth, requirePlatformContext);

router.get(
  "/businesses",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listPlatformBusinessesController,
);
router.get(
  "/businesses/:idBusiness",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  getPlatformBusinessByIdController,
);
router.get(
  "/businesses/:idBusiness/users",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listPlatformBusinessUsersController,
);
router.get(
  "/businesses/:idBusiness/activity",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  getPlatformBusinessActivityController,
);
router.get(
  "/businesses/:idBusiness/usage",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  getPlatformBusinessUsageController,
);
router.get(
  "/businesses/:idBusiness/recent-sales",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listPlatformBusinessRecentSalesController,
);
router.get(
  "/businesses/:idBusiness/recent-purchases",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listPlatformBusinessRecentPurchasesController,
);
router.patch(
  "/businesses/:idBusiness/status",
  requirePlatformRoles(["SUPER_ADMIN"]),
  changePlatformBusinessStatusController,
);
router.post(
  "/businesses/:idBusiness/users/:idUser/reset-password",
  requirePlatformRoles(["SUPER_ADMIN"]),
  passwordResetRateLimiter,
  resetPlatformBusinessUserPasswordController,
);

export default router;
