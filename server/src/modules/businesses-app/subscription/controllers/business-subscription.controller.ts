import type { Request, Response } from "express";
import { getCurrentBusinessSubscriptionService } from "@/modules/platform/subscriptions/services/subscriptions.service.js";

export async function getBusinessCurrentSubscriptionController(
  req: Request,
  res: Response,
): Promise<Response> {
  const result = await getCurrentBusinessSubscriptionService(
    req.user!.idBusiness,
  );

  return res.status(200).json({
    success: true,
    message: "Suscripcion del negocio obtenida correctamente",
    data: result,
  });
}
