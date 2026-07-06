import type { Request, Response } from "express";
import { z } from "zod";
import {
  createInitialStockService,
  getCriticalStockReportService,
  getStockBalanceService,
  getStockByIdService,
  getStockService,
} from "../services/stock.service.js";
import { createInitialStockSchema } from "../validations/stock.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function parseNullablePositiveInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseMaxQuantity(value: unknown): number {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 10;
  }

  return parsed;
}

export async function createInitialStockController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const stockData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    };
    const data = createInitialStockSchema.parse(stockData);
    const result = await createInitialStockService(data);

    return res.status(201).json({
      status: true,
      message: "Stock inicial registrado correctamente",
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

export async function getStockController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getStockService(req.user!.idBusiness);

    return res.status(200).json({
      status: true,
      message: "Stock obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getStockByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idStock = Number(req.params.id);

    if (!Number.isInteger(idStock) || idStock <= 0) {
      return res.status(400).json({
        status: false,
        message: "El id del stock debe ser valido",
      });
    }

    const result = await getStockByIdService(req.user!.idBusiness, idStock);

    return res.status(200).json({
      status: true,
      message: "Stock obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getStockBalanceController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idProduct = parseNullablePositiveInteger(req.query.idProduct);
    const idDeposit = parseNullablePositiveInteger(req.query.idDeposit);

    if (!idProduct || !idDeposit) {
      return res.status(400).json({
        status: false,
        message: "El producto y el deposito son obligatorios",
      });
    }

    const result = await getStockBalanceService(
      req.user!.idBusiness,
      idProduct,
      idDeposit,
    );

    return res.status(200).json({
      status: true,
      message: "Balance de stock obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getCriticalStockReportController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getCriticalStockReportService({
      idBusiness: req.user!.idBusiness,
      maxQuantity: parseMaxQuantity(req.query.maxQuantity),
      idDeposit: parseNullablePositiveInteger(req.query.idDeposit),
      searchProduct:
        typeof req.query.search === "string" ? req.query.search.trim() : null,
    });

    return res.status(200).json({
      status: true,
      message: "Informe de stock critico obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}
