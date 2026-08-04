import type { Request, Response } from "express";
import { z } from "zod";
import {
  getPaymentMethodErrorMessage,
  getPaymentMethodErrorStatus,
  getPaymentMethodZodErrors,
} from "../helpers/payment-method-error.helper.js";
import {
  changePaymentMethodStatusService,
  createPaymentMethodService,
  getPaymentMethodByIdService,
  listPaymentMethodsService,
  setDefaultPaymentMethodService,
  updatePaymentMethodService,
} from "../services/payment-methods.service.js";
import {
  changePaymentMethodStatusSchema,
  createPaymentMethodSchema,
  listPaymentMethodsSchema,
  paymentMethodIdSchema,
  updatePaymentMethodSchema,
} from "../validations/payment-methods.validations.js";

function sendControllerError(res: Response, error: unknown): Response {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      status: false,
      message: "Error de validacion",
      errors: getPaymentMethodZodErrors(error),
    });
  }

  const message = getPaymentMethodErrorMessage(error);
  return res.status(getPaymentMethodErrorStatus(message)).json({
    status: false,
    message,
  });
}

function parseBooleanQuery(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

export async function listPaymentMethodsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = listPaymentMethodsSchema.parse({
      idBusiness: req.user!.idBusiness,
      onlyActive: parseBooleanQuery(req.query.onlyActive),
    });
    const result = await listPaymentMethodsService(data);
    return res.status(200).json({
      status: true,
      message: "Metodos de pago obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function getPaymentMethodByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = paymentMethodIdSchema.parse({
      idBusiness: req.user!.idBusiness,
      idPaymentMethod: Number(req.params.idPaymentMethod),
    });
    const result = await getPaymentMethodByIdService(data);
    return res.status(200).json({
      status: true,
      message: "Metodo de pago obtenido correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function createPaymentMethodController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createPaymentMethodSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    });
    const result = await createPaymentMethodService(data);
    return res.status(201).json({
      status: true,
      message: "Metodo de pago creado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function updatePaymentMethodController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = updatePaymentMethodSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idPaymentMethod: Number(req.params.idPaymentMethod),
    });
    const result = await updatePaymentMethodService(data);
    return res.status(200).json({
      status: true,
      message: "Metodo de pago actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function changePaymentMethodStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = changePaymentMethodStatusSchema.parse({
      idBusiness: req.user!.idBusiness,
      idPaymentMethod: Number(req.params.idPaymentMethod),
      isActive: req.body.isActive,
    });
    const result = await changePaymentMethodStatusService(data);
    return res.status(200).json({
      status: true,
      message: "Estado del metodo de pago actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function setDefaultPaymentMethodController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = paymentMethodIdSchema.parse({
      idBusiness: req.user!.idBusiness,
      idPaymentMethod: Number(req.params.idPaymentMethod),
    });
    const result = await setDefaultPaymentMethodService(data);
    return res.status(200).json({
      status: true,
      message: "Metodo de pago predeterminado actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}
