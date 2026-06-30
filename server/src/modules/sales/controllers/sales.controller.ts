import type { Request, Response } from "express";
import { z } from "zod";
import {
  cancelSaleService,
  createSaleService,
  getProductsWithStockByDepositService,
  getSaleByIdService,
  getSalesService,
} from "../services/sales.service.js";
import {
  createSaleSchema,
  productsByDepositSchema,
  saleIdParamSchema,
} from "../validations/sales.validations.js";
import {
  parseNullableDate,
  parseNullablePositiveInteger,
  parsePositiveInteger,
  parseSaleStatus,
} from "../helpers/index.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export async function createSaleController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const saleData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    };
    const data = createSaleSchema.parse(saleData);
    const result = await createSaleService(data);
    return res.status(201).json({
      status: true,
      message: "Venta procesada con exito",
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

export async function getSalesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 15);
    const offset = (page - 1) * limit;
    const result = await getSalesService({
      idBusiness: req.user!.idBusiness,
      page,
      limit,
      offset,
      idDeposit: parseNullablePositiveInteger(req.query.idDeposit),
      status: parseSaleStatus(req.query.status),
      startDate: parseNullableDate(req.query.startDate, false),
      endDate: parseNullableDate(req.query.endDate, true),
    });

    return res.status(200).json({
      status: true,
      message: "Ventas obtenidas correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getSaleByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = {
      idBusiness: req.user!.idBusiness,
      idSale: Number(req.params.id),
    };
    const data = saleIdParamSchema.parse(params);
    const result = await getSaleByIdService(data.idBusiness, data.idSale);

    return res.status(200).json({
      status: true,
      message: "Venta obtenida correctamente",
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

export async function cancelSaleController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = {
      idBusiness: req.user!.idBusiness,
      idSale: Number(req.params.id),
    };
    const data = saleIdParamSchema.parse(params);
    const result = await cancelSaleService(data);

    return res.status(200).json({
      status: true,
      message: "Venta anulada correctamente",
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
      sqlState: error.sqlState,
    });
  }
}

export async function getProductsWithStockByDepositController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = {
      idBusiness: req.user!.idBusiness,
      idDeposit: Number(req.params.idDeposit),
    };
    const data = productsByDepositSchema.parse(params);
    const result = await getProductsWithStockByDepositService(
      data.idBusiness,
      data.idDeposit,
    );

    return res.status(200).json({
      status: true,
      message: "Productos con stock obtenidos correctamente",
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
