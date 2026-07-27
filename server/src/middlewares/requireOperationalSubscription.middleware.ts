import type { NextFunction, Request, Response } from "express";
import { getCurrentBusinessSubscriptionService } from "@/modules/platform/subscriptions/services/subscriptions.service.js";

export async function requireOperationalSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.subscription?.access.canOperate) {
    next();
    return;
  }

  if (req.auth?.context !== "BUSINESS") {
    res.status(403).json({
      success: false,
      message: "Acceso permitido solo para negocios",
      data: null,
    });
    return;
  }

  const subscription = await getCurrentBusinessSubscriptionService(
    req.auth.idBusiness,
  );

  req.subscription = subscription;

  if (!subscription.access.canOperate) {
    res.status(402).json({
      success: false,
      code: "SUBSCRIPTION_REQUIRED",
      message: "La suscripcion del negocio no se encuentra habilitada",
      data: {
        status: subscription.subscription?.status ?? null,
      },
    });
    return;
  }

  next();
}
