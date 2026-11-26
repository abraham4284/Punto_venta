import { businessDateRange } from "@/helpers/business-time.helper.js";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  getIdempotencyKeyFromRequest,
  isIdempotencyError,
} from "@/helpers/idempotency.helper.js";
import {
  cancelPurchaseService,
  createPurchaseService,
  getPurchaseByIdService,
  getPurchasesService,
} from "../services/purchases.service.js";
import {
  createPurchaseSchema,
  purchaseIdParamSchema,
} from "../validations/purchases.validations.js";
import type { PurchaseStatus } from "../types/index.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
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

function parseNullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = value.trim();
  return parsed ? parsed : null;
}

function parsePurchaseStatus(value: unknown): PurchaseStatus | null {
  if (value === "COMPLETED" || value === "CANCELLED") {
    return value;
  }

  return null;
}

function isDuplicateEntryError(error: any): boolean {
  return error?.code === "ER_DUP_ENTRY" || error?.errno === 1062;
}

export async function createPurchaseController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const purchaseData = {
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idempotencyKey: getIdempotencyKeyFromRequest(req),
    };
    const data = createPurchaseSchema.parse(purchaseData);
    const result = await createPurchaseService(data);

    return res.status(result.idempotentReplay ? 200 : 201).json({
      status: true,
      message: result.idempotentReplay
        ? "Compra ya procesada previamente"
        : "Compra registrada correctamente",
      idempotentReplay: result.idempotentReplay,
      data: result.purchase,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: false,
        message: "Error de validacion en los datos enviados",
        errors: getZodErrors(error),
      });
    }

    if (isDuplicateEntryError(error)) {
      return res.status(400).json({
        status: false,
        message:
          "El numero de compra generado ya existe, por favor intente nuevamente",
      });
    }

    const message = error.sqlMessage || error.message;

    if (isIdempotencyError(message)) {
      return res.status(400).json({
        status: false,
        message,
      });
    }

    return res.status(400).json({
      status: false,
      message,
    });
  }
}

export async function getPurchasesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 15);
    const offset = (page - 1) * limit;
    const result = await getPurchasesService({
      idBusiness: req.user!.idBusiness,
      page,
      limit,
      offset,
      status: parsePurchaseStatus(req.query.status),
      idSupplier: parseNullablePositiveInteger(req.query.idSupplier),
      idDeposit: parseNullablePositiveInteger(req.query.idDeposit),
      purchaseNumberSearch: parseNullableText(req.query.purchaseNumber),
      ...businessDateRange(req.query.startDate, req.query.endDate),
    });

    return res.status(200).json({
      status: true,
      message: "Compras obtenidas correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.sqlMessage || error.message,
    });
  }
}

export async function getPurchaseByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = {
      idBusiness: req.user!.idBusiness,
      idPurchase: Number(req.params.id),
    };
    const data = purchaseIdParamSchema.parse(params);
    const result = await getPurchaseByIdService(
      data.idBusiness,
      data.idPurchase,
    );

    return res.status(200).json({
      status: true,
      message: "Compra obtenida correctamente",
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

export async function cancelPurchaseController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = {
      idBusiness: req.user!.idBusiness,
      idPurchase: Number(req.params.id),
    };
    const data = purchaseIdParamSchema.parse(params);
    const result = await cancelPurchaseService(data);

    return res.status(200).json({
      status: true,
      message: "Compra anulada correctamente",
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
