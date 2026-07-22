import type { Request, Response } from "express";
import { z } from "zod";
import { getDashboardDataService } from "../services/dashboard.service.js";
import { dashboardQuerySchema } from "../validations/dashboard.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export async function getDashboardDataController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const idBusiness = req.user!.idBusiness;
    const selectedYear = query.year ?? new Date().getFullYear();
    const result = await getDashboardDataService(idBusiness, selectedYear);

    return res.status(200).json({
      status: true,
      message: "Metricas obtenidas",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}
