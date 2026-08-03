import type { Request, Response } from "express";
import { z } from "zod";
import {
  getCashErrorStatus,
  getErrorMessage,
  getZodFieldErrors,
  parseOptionalDate,
  parseOptionalPositiveInteger,
} from "../../cash/helpers/cash-error.helper.js";
import {
  closeCashSessionService,
  getCashSessionByIdService,
  getCashSessionLiveSummaryService,
  getCurrentCashSessionService,
  listCashSessionPaymentSummariesService,
  listCashSessionsService,
  openCashSessionService,
} from "../services/cash-sessions.service.js";
import {
  cashSessionIdSchema,
  closeCashSessionSchema,
  openCashSessionSchema,
} from "../validations/cash-sessions.validations.js";
import type { CashSessionStatus } from "../types/index.js";

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

function parseStatus(value: unknown): CashSessionStatus | null {
  if (value === "OPEN" || value === "CLOSED") return value;
  return null;
}

export async function openCashSessionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = openCashSessionSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
    });
    const result = await openCashSessionService(data);
    return res.status(201).json({
      status: true,
      message: "Caja abierta correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function getCurrentCashSessionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const idCashRegister = parseOptionalPositiveInteger(req.query.idCashRegister);
    const result = await getCurrentCashSessionService(
      req.user!.idBusiness,
      idCashRegister,
    );
    return res.status(200).json({
      status: true,
      message: result ? "Caja actual obtenida correctamente" : "No hay caja abierta",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function listCashSessionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const page = parseOptionalPositiveInteger(req.query.page) ?? 1;
    const limit = parseOptionalPositiveInteger(req.query.limit) ?? 15;
    const result = await listCashSessionsService({
      idBusiness: req.user!.idBusiness,
      page,
      limit,
      offset: (page - 1) * limit,
      idCashRegister: parseOptionalPositiveInteger(req.query.idCashRegister),
      idUser: parseOptionalPositiveInteger(req.query.idUser),
      status: parseStatus(req.query.status),
      startDate: parseOptionalDate(req.query.startDate, false),
      endDate: parseOptionalDate(req.query.endDate, true),
    });
    return res.status(200).json({
      status: true,
      message: "Sesiones de caja obtenidas correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function getCashSessionByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashSessionIdSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashSession: Number(req.params.idCashSession),
    });
    const result = await getCashSessionByIdService(data);
    return res.status(200).json({
      status: true,
      message: "Sesion de caja obtenida correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function getCashSessionSummaryController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashSessionIdSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashSession: Number(req.params.idCashSession),
    });
    const result = await getCashSessionLiveSummaryService(data);
    return res.status(200).json({
      status: true,
      message: "Resumen de caja obtenido correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function closeCashSessionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = closeCashSessionSchema.parse({
      ...req.body,
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      idCashSession: Number(req.params.idCashSession),
    });
    const result = await closeCashSessionService(data);
    return res.status(200).json({
      status: true,
      message: "Caja cerrada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}

export async function listCashSessionPaymentSummariesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = cashSessionIdSchema.parse({
      idBusiness: req.user!.idBusiness,
      idCashSession: Number(req.params.idCashSession),
    });
    const result = await listCashSessionPaymentSummariesService(data);
    return res.status(200).json({
      status: true,
      message: "Resumenes por metodo de pago obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    return sendControllerError(res, error);
  }
}
