import type { Request, Response } from "express";
import { z } from "zod";
import {
  getStockMovementsService,
  processStockAdjustmentService,
  processStockTransferService,
} from "../services/stock_movements.service.js";
import {
  processStockAdjustmentSchema,
  processStockTransferSchema,
} from "../validations/stock_movements.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export async function getStockMovementsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const requestedPage = Number(req.query.page ?? 1);
    const requestedLimit = Number(req.query.limit ?? 15);
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 15;
    const offset = (Number(page) - 1) * Number(limit);
    const idDepositValue = Number(req.query.idDeposit);
    const idDeposit =
      Number.isInteger(idDepositValue) && idDepositValue > 0
        ? idDepositValue
        : null;
    const movementType =
      typeof req.query.movementType === "string"
        ? req.query.movementType
        : null;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : null;

    const result = await getStockMovementsService({
      idBusiness: req.user!.idBusiness,
      limit,
      offset,
      movementType,
      idDeposit,
      search,
    });

    return res.status(200).json({
      status: true,
      message: "Movimientos de stock obtenidos correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function processStockAdjustmentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const adjustmentData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    };
    const data = processStockAdjustmentSchema.parse(adjustmentData);
    const result = await processStockAdjustmentService(data);

    return res.status(200).json({
      status: true,
      message: "Ajuste de stock procesado correctamente",
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

export async function processStockTransferController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const transferData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    };
    const data = processStockTransferSchema.parse(transferData);
    const result = await processStockTransferService(data);

    return res.status(200).json({
      status: true,
      message: "Transferencia de stock procesada correctamente",
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
