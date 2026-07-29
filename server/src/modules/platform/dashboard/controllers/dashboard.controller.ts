import type { Request, Response } from "express";
import { getControllerErrorResponse } from "../../helpers/platform-error.helper.js";
import { getPlatformDashboardService } from "../services/dashboard.service.js";

export async function getPlatformDashboardController(
  _req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getPlatformDashboardService();

    return res.status(200).json({
      success: true,
      message: "Dashboard obtenido correctamente",
      data: result,
    });
  } catch (error) {
    const response = getControllerErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}
