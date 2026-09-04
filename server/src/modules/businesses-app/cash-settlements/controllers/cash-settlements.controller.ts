import type { Request, Response } from "express";
import { z } from "zod";
import {
  createCashSettlementService,
  getCashSettlementByIdService,
  listCashSettlementsService,
} from "../services/cash-settlements.service.js";
import {
  cashSettlementIdParamSchema,
  cashSettlementListQuerySchema,
  createCashSettlementSchema,
} from "../validations/cash-settlements.validations.js";

interface ControllerError {
  sqlMessage?: string;
  message?: string;
}

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function getErrorMessage(error: unknown): string {
  const parsed = error as ControllerError;
  return parsed.sqlMessage || parsed.message || "Error inesperado";
}

export async function listCashSettlementsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashSettlementListQuerySchema.parse({
      idBusiness: req.user!.idBusiness,
      page: req.query.page,
      limit: req.query.limit,
      collectorUserId: req.query.collectorUserId || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    });
    const limit = Number(data.limit);
    const page = Number(data.page);
    const result = await listCashSettlementsService({
      ...data,
      page,
      limit,
      offset: (page - 1) * limit,
    });

    return res.status(200).json({
      status: true,
      message: "Liquidaciones obtenidas correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: getErrorMessage(error),
    });
  }
}

export async function getCashSettlementByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashSettlementIdParamSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashSettlement: Number(req.params.id),
    });
    const result = await getCashSettlementByIdService(
      data.idBusiness,
      data.idCashSettlement,
    );

    return res.status(200).json({
      status: true,
      message: "Liquidacion obtenida correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: getErrorMessage(error),
    });
  }
}

export async function createCashSettlementController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createCashSettlementSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      receivedByUserId: req.user!.idUser,
    });
    const result = await createCashSettlementService(data);

    return res.status(201).json({
      status: true,
      message: "Liquidacion registrada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    return res.status(400).json({
      status: false,
      message: getErrorMessage(error),
    });
  }
}
