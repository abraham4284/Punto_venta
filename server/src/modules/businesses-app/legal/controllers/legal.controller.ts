import type { Request, Response } from "express";
import { z } from "zod";
import {
  getBusinessUserLegalStatusService,
  getCurrentLegalDocumentService,
  getCurrentLegalDocumentsService,
  getLegalDocumentVersionService,
  recordLegalAcceptanceService,
} from "../services/legal.service.js";
import {
  legalCodeParamsSchema,
  legalVersionParamsSchema,
  recordLegalAcceptanceSchema,
} from "../validations/legal.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function getLegalErrorMessage(error: any): string {
  if (error?.sqlMessage === "LEGAL_DOCUMENT_NOT_AVAILABLE") {
    return "Los documentos legales necesarios para crear una cuenta no están disponibles temporalmente.";
  }

  if (error?.sqlMessage === "LEGAL_TERMS_OWNER_REQUIRED") {
    return "Solo el propietario del negocio puede aceptar los términos y condiciones.";
  }

  if (error?.sqlMessage === "LEGAL_ACTION_NOT_REQUIRED") {
    return "Este documento legal no requiere acción del usuario.";
  }

  return error?.sqlMessage || error?.message || "No se pudo procesar la solicitud legal";
}

function getErrorStatus(error: any): number {
  if (error?.statusCode) return error.statusCode;
  if (error?.sqlState === "45000") return 400;
  return 500;
}

export async function getCurrentLegalDocumentsController(
  _req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getCurrentLegalDocumentsService();

    return res.status(200).json({
      status: true,
      message: "Documentos legales obtenidos correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: getLegalErrorMessage(error),
    });
  }
}

export async function getCurrentLegalDocumentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = legalCodeParamsSchema.parse(req.params);
    const result = await getCurrentLegalDocumentService(params.code);

    return res.status(200).json({
      status: true,
      message: "Documento legal obtenido correctamente",
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

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: getLegalErrorMessage(error),
    });
  }
}

export async function getLegalDocumentVersionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const params = legalVersionParamsSchema.parse(req.params);
    const result = await getLegalDocumentVersionService(
      params.code,
      params.version,
    );

    return res.status(200).json({
      status: true,
      message: "Version legal obtenida correctamente",
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

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: getLegalErrorMessage(error),
    });
  }
}

export async function getMyLegalAcceptancesController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getBusinessUserLegalStatusService(
      req.user!.idBusiness,
      req.user!.idUser,
    );

    return res.status(200).json({
      status: true,
      message: "Estado legal obtenido correctamente",
      data: result,
    });
  } catch (error: any) {
    return res.status(getErrorStatus(error)).json({
      status: false,
      message: getLegalErrorMessage(error),
    });
  }
}

export async function recordLegalAcceptanceController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const body = recordLegalAcceptanceSchema.parse(req.body);
    const result = await recordLegalAcceptanceService(
      req.user!.idBusiness,
      req.user!.idUser,
      body.code,
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      status: true,
      message: "Aceptacion legal registrada correctamente",
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

    return res.status(getErrorStatus(error)).json({
      status: false,
      message: getLegalErrorMessage(error),
    });
  }
}
