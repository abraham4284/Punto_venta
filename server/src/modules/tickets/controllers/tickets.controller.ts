import type { Request, Response } from "express";
import { z } from "zod";
import { getSaleTicketService } from "../services/tickets.service.js";
import { saleTicketParamSchema } from "../validations/tickets.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export async function getSaleTicketController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = {
      idBusiness: req.user!.idBusiness,
      idSale: Number(req.params.idSale),
    };
    const data = saleTicketParamSchema.parse(params);
    const result = await getSaleTicketService(data.idBusiness, data.idSale);

    return res.status(200).json({
      status: true,
      message: "Ticket generado con exito",
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
