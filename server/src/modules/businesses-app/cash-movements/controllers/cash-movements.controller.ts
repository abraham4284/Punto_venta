import type { Request, Response } from "express";
import { z } from "zod";
import {
  getCashErrorStatus,
  getErrorMessage,
  getZodFieldErrors,
} from "../../cash/helpers/cash-error.helper.js";
import {
  createCashMovementService,
  listCashMovementsBySessionService,
} from "../services/cash-movements.service.js";
import {
  cashMovementSessionSchema,
  createCashMovementSchema,
} from "../validations/cash-movements.validations.js";

function sendControllerError(res: Response, error: unknown): Response {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      status: false,
      message: "Error de validacion",
      errors: getZodFieldErrors(error),
    });
  }

  const message = getErrorMessage(error);
  return res.status(getCashErrorStatus(message)).json({
    status: false,
    message,
  });
}

export async function createCashMovementController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createCashMovementSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idCashSession: Number(req.params.idCashSession),
    });
    const result = await createCashMovementService(data);
    return res.status(201).json({
      status: true,
      message: "Movimiento de caja registrado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function listCashMovementsBySessionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashMovementSessionSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashSession: Number(req.params.idCashSession),
    });
    const result = await listCashMovementsBySessionService(data);
    return res.status(200).json({
      status: true,
      message: "Movimientos de caja obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}
