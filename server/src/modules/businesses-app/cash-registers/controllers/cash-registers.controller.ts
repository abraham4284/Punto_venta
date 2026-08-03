import type { Request, Response } from "express";
import { z } from "zod";
import {
  getCashErrorStatus,
  getErrorMessage,
  getZodFieldErrors,
} from "../../cash/helpers/cash-error.helper.js";
import {
  changeCashRegisterStatusService,
  createCashRegisterService,
  getCashRegisterByIdService,
  listCashRegistersService,
  setDefaultCashRegisterService,
  updateCashRegisterService,
} from "../services/cash-registers.service.js";
import {
  cashRegisterIdSchema,
  changeCashRegisterStatusSchema,
  createCashRegisterSchema,
  updateCashRegisterSchema,
} from "../validations/cash-registers.validations.js";

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

export async function createCashRegisterController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createCashRegisterSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
    });
    const result = await createCashRegisterService(data);
    return res.status(201).json({
      status: true,
      message: "Caja creada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function listCashRegistersController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await listCashRegistersService(req.user!.idBusiness);
    return res.status(200).json({
      status: true,
      message: "Cajas obtenidas correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function getCashRegisterByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashRegisterIdSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashRegister: Number(req.params.idCashRegister),
    });
    const result = await getCashRegisterByIdService(data);
    return res.status(200).json({
      status: true,
      message: "Caja obtenida correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function updateCashRegisterController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = updateCashRegisterSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idCashRegister: Number(req.params.idCashRegister),
    });
    const result = await updateCashRegisterService(data);
    return res.status(200).json({
      status: true,
      message: "Caja actualizada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function changeCashRegisterStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = changeCashRegisterStatusSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashRegister: Number(req.params.idCashRegister),
      isActive: req.body.isActive,
    });
    const result = await changeCashRegisterStatusService(data);
    return res.status(200).json({
      status: true,
      message: "Estado de caja actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function setDefaultCashRegisterController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashRegisterIdSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashRegister: Number(req.params.idCashRegister),
    });
    const result = await setDefaultCashRegisterService(data);
    return res.status(200).json({
      status: true,
      message: "Caja predeterminada actualizada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}
