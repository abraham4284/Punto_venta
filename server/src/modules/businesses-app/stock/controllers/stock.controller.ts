import type { Request, Response } from "express";
import { z } from "zod";
import {
  createInitialStockService,
  getAdvancedStockInventoryService,
  getCriticalStockReportService,
  getStockBalanceService,
  getStockByIdService,
  getStockService,
  searchProductsForStockService,
} from "../services/stock.service.js";
import {
  advancedStockQuerySchema,
  createInitialStockSchema,
  criticalStockReportQuerySchema,
  stockProductSearchQuerySchema,
  stockPaginationQuerySchema,
} from "../validations/stock.validations.js";

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
    const filters = stockPaginationQuerySchema.parse(req.query);
    const result = await getStockService(req.user!.idBusiness, filters);

    return res.status(200).json({
      status: true,
      message: "Stock obtenido correctamente",
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

export async function searchProductsForStockController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const filters = stockProductSearchQuerySchema.parse(req.query);
    const result = await searchProductsForStockService(req.user!.idBusiness, {
      search: filters.search ?? null,
      limit: filters.limit,
    });

    return res.status(200).json({
      status: true,
      message: "Productos para stock obtenidos correctamente",
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

export async function getCriticalStockReportController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const filters = criticalStockReportQuerySchema.parse(req.query);
    const result = await getCriticalStockReportService({
      idBusiness: req.user!.idBusiness,
      maxQuantity: filters.maxQuantity ?? null,
      idDeposit: filters.idDeposit ?? null,
      searchProduct: filters.search ?? null,
      alertStatus: filters.alertStatus ?? null,
    });

    return res.status(200).json({
      status: true,
      message: "Panel de reposicion obtenido correctamente",
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

export async function getAdvancedStockInventoryController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const filters = advancedStockQuerySchema.parse(req.query);
    const result = await getAdvancedStockInventoryService(
      req.user!.idBusiness,
      {
        search: filters.search ?? null,
        idDeposit: filters.idDeposit ?? null,
        quantity: filters.quantity ?? null,
        minQuantity: filters.minQuantity ?? null,
        maxQuantity: filters.maxQuantity ?? null,
        alertStatus: filters.alertStatus ?? null,
        page: filters.page,
        limit: filters.limit,
      },
    );

    return res.status(200).json({
      status: true,
      message: "Inventario avanzado obtenido correctamente",
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
