import { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import { requirePlatformRoles } from "@/middlewares/requirePlatformRoles.middleware.js";
import {
  assignBusinessSubscriptionController,
  cancelBusinessSubscriptionController,
  changeBusinessSubscriptionPlanController,
  createSubscriptionPaymentController,
  createSubscriptionPlanController,
  getBusinessSubscriptionByIdController,
  getSubscriptionPaymentByIdController,
  getSubscriptionPlanByIdController,
  listBusinessOptionsController,
  listBusinessSubscriptionsController,
  listSubscriptionEventsController,
  listSubscriptionPaymentsController,
  listSubscriptionPlansController,
  processExpiredSubscriptionsController,
  reactivateBusinessSubscriptionController,
  suspendBusinessSubscriptionController,
  toggleSubscriptionPlanStatusController,
  updateAutoRenewController,
  updatePaymentStatusController,
  updateSubscriptionPlanController,
} from "../controllers/subscriptions.controller.js";

const router = Router();

const subscriptionRoutePrefixes = [
  "/business-options",
  "/subscription-plans",
  "/business-subscriptions",
  "/subscription-payments",
  "/subscription-events",
  "/subscriptions",
];

function skipUnmatchedSubscriptionRoutes(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const matchesRoute = subscriptionRoutePrefixes.some(function hasPrefix(prefix) {
    return req.path.startsWith(prefix);
  });

  if (!matchesRoute) {
    next("router");
    return;
  }

  next();
}

router.use(skipUnmatchedSubscriptionRoutes);
router.use(requireAuth, requirePlatformContext);

router.get(
  "/business-options",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listBusinessOptionsController,
);

router.get(
  "/subscription-plans",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listSubscriptionPlansController,
);
router.get(
  "/subscription-plans/:idSubscriptionPlan",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  getSubscriptionPlanByIdController,
);
router.post(
  "/subscription-plans",
  requirePlatformRoles(["SUPER_ADMIN"]),
  createSubscriptionPlanController,
);
router.patch(
  "/subscription-plans/:idSubscriptionPlan",
  requirePlatformRoles(["SUPER_ADMIN"]),
  updateSubscriptionPlanController,
);
router.patch(
  "/subscription-plans/:idSubscriptionPlan/status",
  requirePlatformRoles(["SUPER_ADMIN"]),
  toggleSubscriptionPlanStatusController,
);

router.get(
  "/business-subscriptions",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listBusinessSubscriptionsController,
);
router.get(
  "/business-subscriptions/:idBusinessSubscription",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  getBusinessSubscriptionByIdController,
);
router.post(
  "/business-subscriptions",
  requirePlatformRoles(["SUPER_ADMIN"]),
  assignBusinessSubscriptionController,
);
router.patch(
  "/business-subscriptions/:idBusinessSubscription/plan",
  requirePlatformRoles(["SUPER_ADMIN"]),
  changeBusinessSubscriptionPlanController,
);
router.patch(
  "/business-subscriptions/:idBusinessSubscription/suspend",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT"]),
  suspendBusinessSubscriptionController,
);
router.patch(
  "/business-subscriptions/:idBusinessSubscription/reactivate",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT"]),
  reactivateBusinessSubscriptionController,
);
router.patch(
  "/business-subscriptions/:idBusinessSubscription/cancel",
  requirePlatformRoles(["SUPER_ADMIN"]),
  cancelBusinessSubscriptionController,
);
router.patch(
  "/business-subscriptions/:idBusinessSubscription/auto-renew",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT"]),
  updateAutoRenewController,
);
router.get(
  "/business-subscriptions/:idBusinessSubscription/events",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listSubscriptionEventsController,
);

router.get(
  "/subscription-payments",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listSubscriptionPaymentsController,
);
router.get(
  "/subscription-payments/:idSubscriptionPayment",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  getSubscriptionPaymentByIdController,
);
router.post(
  "/subscription-payments",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT"]),
  createSubscriptionPaymentController,
);
router.patch(
  "/subscription-payments/:idSubscriptionPayment/:status",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT"]),
  updatePaymentStatusController,
);

router.get(
  "/subscription-events",
  requirePlatformRoles(["SUPER_ADMIN", "SUPPORT", "ANALYST"]),
  listSubscriptionEventsController,
);
router.post(
  "/subscriptions/process-expirations",
  requirePlatformRoles(["SUPER_ADMIN"]),
  processExpiredSubscriptionsController,
);

export default router;
