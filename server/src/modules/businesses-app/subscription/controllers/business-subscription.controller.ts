import type { Request, Response } from "express";
import { getBusinessSubscriptionOverviewService } from "../services/business-subscription.service.js";

export async function getBusinessCurrentSubscriptionController(
  req: Request,
  res: Response,
): Promise<Response> {
  const result = await getBusinessSubscriptionOverviewService(
    req.user!.idBusiness,
  );

  return res.status(200).json({
    success: true,
    message: "Suscripcion del negocio obtenida correctamente",
    data: result,
  });
}
