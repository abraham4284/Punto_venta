import type { Request, Response } from "express";
import { z } from "zod";
import {
  cancelSalePaymentService,
  collectSalePaymentService,
  confirmSalePaymentService,
  createSalePaymentService,
  listSalePaymentsService,
  updateSalePaymentService,
} from "../services/sale-payments.service.js";
import {
  createSalePaymentSchema,
  salePaymentActionSchema,
  salePaymentIdParamSchema,
  salePaymentSaleIdParamSchema,
  updateSalePaymentSchema,
} from "../validations/sale-payments.validations.js";

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

export async function listSalePaymentsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = salePaymentSaleIdParamSchema.parse({
      idBusiness: req.user!.idBusiness,
      idSale: Number(req.params.idSale),
    });
    const result = await listSalePaymentsService(data.idBusiness, data.idSale);

    return res.status(200).json({
      status: true,
      message: "Pagos obtenidos correctamente",
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

export async function createSalePaymentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createSalePaymentSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idSale: Number(req.params.idSale),
    });
    const result = await createSalePaymentService(data);

    return res.status(201).json({
      status: true,
      message: "Pago registrado correctamente",
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

export async function updateSalePaymentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = updateSalePaymentSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idSalePayment: Number(req.params.idSalePayment),
    });
    const result = await updateSalePaymentService(data);

    return res.status(200).json({
      status: true,
      message: "Pago actualizado correctamente",
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

export async function cancelSalePaymentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = salePaymentActionSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idSalePayment: Number(req.params.idSalePayment),
    });
    const result = await cancelSalePaymentService(data);

    return res.status(200).json({
      status: true,
      message: "Pago anulado correctamente",
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

export async function collectSalePaymentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = salePaymentActionSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idSalePayment: Number(req.params.idSalePayment),
    });
    const result = await collectSalePaymentService(data);

    return res.status(200).json({
      status: true,
      message: "Pago cobrado correctamente",
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

export async function confirmSalePaymentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = salePaymentActionSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idSalePayment: Number(req.params.idSalePayment),
    });
    const result = await confirmSalePaymentService(data);

    return res.status(200).json({
      status: true,
      message: "Pago confirmado correctamente",
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
