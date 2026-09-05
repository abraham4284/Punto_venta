import type { Request, Response } from "express";
import { z } from "zod";
import {
  getIdempotencyKeyFromRequest,
  isIdempotencyError,
} from "@/helpers/idempotency.helper.js";
import {
  cancelSaleService,
  createSaleService,
  getDeliveryUsersForSaleService,
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

interface ControllerError {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
  sqlState?: string;
}

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function toControllerError(error: unknown): ControllerError {
  if (error && typeof error === "object") {
    return error as ControllerError;
  }

  return {
    message: "Error inesperado",
  };
}

function getControllerMessage(error: ControllerError): string {
  return error.sqlMessage || error.message || "Error inesperado";
}

function isDuplicateEntryError(error: unknown): boolean {
  const parsedError = toControllerError(error);
  return parsedError.code === "ER_DUP_ENTRY" || parsedError.errno === 1062;
}

function getSaleErrorStatus(message: string): number {
  const notFoundErrors = new Set([
    "PAYMENT_METHOD_NOT_FOUND",
  ]);

  const conflictErrors = new Set([
    "OPEN_CASH_SESSION_REQUIRED",
    "CASH_SESSION_NOT_FOUND",
    "CASH_SESSION_CLOSED",
    "CASH_REGISTER_INACTIVE",
    "CLOSED_CASH_SESSION_SALE_CANNOT_BE_CANCELLED",
    "PAYMENT_METHOD_INACTIVE",
  ]);

  if (notFoundErrors.has(message)) return 404;
  return conflictErrors.has(message) ? 409 : 400;
}

function parseNullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = value.trim();
  return parsed ? parsed : null;
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
      idempotencyKey: getIdempotencyKeyFromRequest(req),
    };
    const data = createSaleSchema.parse(saleData);
    const result = await createSaleService(data);
    return res.status(result.idempotentReplay ? 200 : 201).json({
      status: true,
      message: result.idempotentReplay
        ? "Venta ya procesada previamente"
        : "Venta procesada con exito",
      idempotentReplay: result.idempotentReplay,
      data: result.sale,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    if (isDuplicateEntryError(error)) {
      return res.status(400).json({
        status: false,
        message:
          "El número de venta generado ya existe, por favor intente nuevamente",
      });
    }

    const message = getControllerMessage(toControllerError(error));
    if (isIdempotencyError(message)) {
      return res.status(400).json({
        status: false,
        message,
      });
    }

    return res.status(getSaleErrorStatus(message)).json({
      status: false,
      message,
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
      idPaymentMethod: parseNullablePositiveInteger(req.query.idPaymentMethod),
      status: parseSaleStatus(req.query.status),
      saleNumberSearch: parseNullableText(req.query.saleNumber),
      startDate: parseNullableDate(req.query.startDate, false),
      endDate: parseNullableDate(req.query.endDate, true),
    });

    return res.status(200).json({
      status: true,
      message: "Ventas obtenidas correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const parsedError = toControllerError(error);

    return res.status(400).json({
      status: false,
      message: getControllerMessage(parsedError),
    });
  }
}

export async function getDeliveryUsersForSaleController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getDeliveryUsersForSaleService(req.user!.idBusiness);

    return res.status(200).json({
      status: true,
      message: "Cadetes obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const parsedError = toControllerError(error);

    return res.status(400).json({
      status: false,
      message: getControllerMessage(parsedError),
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
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    const parsedError = toControllerError(error);

    return res.status(400).json({
      status: false,
      message: getControllerMessage(parsedError),
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
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    const parsedError = toControllerError(error);
    const message = getControllerMessage(parsedError);

    return res.status(getSaleErrorStatus(message)).json({
      status: false,
      message,
      sqlState: parsedError.sqlState,
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
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }

    const parsedError = toControllerError(error);

    return res.status(400).json({
      status: false,
      message: getControllerMessage(parsedError),
    });
  }
}
