import type { Request, Response } from "express";
import { z } from "zod";
import { createProductImportTemplateService } from "../services/create-product-import-template.service.js";
import { previewProductImportService } from "../services/preview-product-import.service.js";
import { confirmProductImportService } from "../services/confirm-product-import.service.js";
import { confirmProductImportSchema } from "../validations/product-import.validation.js";
import {
  createLimitErrorFromSqlMessage,
  isSubscriptionResourceLimitError,
} from "@/modules/businesses-app/subscription/services/subscription-limits.service.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

interface ImportControllerError {
  sqlMessage?: string;
  message?: string;
}

function getClientCode(error: ImportControllerError): string {
  if (error.message === "IMPORT_ROW_LIMIT_EXCEEDED") {
    return "IMPORT_ROW_LIMIT_EXCEEDED";
  }

  if (error.message === "IMPORT_COLUMN_LIMIT_EXCEEDED") {
    return "IMPORT_COLUMN_LIMIT_EXCEEDED";
  }

  if (error.message === "IMPORT_CELL_LIMIT_EXCEEDED") {
    return "INVALID_IMPORT_FILE";
  }

  if (error.message === "INVALID_IMPORT_FILE") {
    return "INVALID_IMPORT_FILE";
  }

  return "INVALID_IMPORT_FILE";
}

function getClientMessage(error: ImportControllerError): string {
  if (error.message === "IMPORT_ROW_LIMIT_EXCEEDED") {
    return "El archivo supera la cantidad maxima de filas permitidas";
  }

  if (error.message === "IMPORT_COLUMN_LIMIT_EXCEEDED") {
    return "El archivo supera la cantidad maxima de columnas permitidas";
  }

  if (error.message === "IMPORT_CELL_LIMIT_EXCEEDED") {
    return "El archivo contiene valores demasiado extensos";
  }

  if (error.message === "INVALID_IMPORT_FILE") {
    return "El archivo de importacion no es valido";
  }

  if (error.message) {
    return error.message;
  }

  return "No se pudo procesar la importacion de productos";
}

export async function downloadProductImportTemplateController(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const buffer = createProductImportTemplateService();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=plantilla-importacion-productos.xlsx",
    );
    res.status(200).send(buffer);
  } catch (error: unknown) {
    const typedError = error as ImportControllerError;
    res.status(400).json({
      status: false,
      message: getClientMessage(typedError),
    });
  }
}

export async function previewProductImportController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Debe adjuntar un archivo Excel para importar",
      });
    }

    const result = await previewProductImportService(
      req.user!.idBusiness,
      req.user!.idUser,
      req.file,
    );

    return res.status(200).json({
      status: true,
      message: "Vista previa generada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const typedError = error as ImportControllerError;
    return res.status(400).json({
      success: false,
      status: false,
      code: getClientCode(typedError),
      message: getClientMessage(typedError),
      data: null,
    });
  }
}

export async function confirmProductImportController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = confirmProductImportSchema.parse(req.body);
    const result = await confirmProductImportService({
      idBusiness: req.user!.idBusiness,
      idUser: req.user!.idUser,
      importToken: data.importToken,
      importMode: data.importMode,
      existingStockMode: data.existingStockMode,
      importValidRowsOnly: data.importValidRowsOnly,
    });

    return res.status(200).json({
      status: true,
      message: "Importacion finalizada con exito",
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

    if (isSubscriptionResourceLimitError(error)) {
      return res.status(error.statusCode).json({
        status: false,
        success: false,
        code: error.code,
        message: error.message,
        data: error.data,
      });
    }

    const typedError = error as ImportControllerError;
    const sqlLimitError = createLimitErrorFromSqlMessage(
      typedError.sqlMessage || typedError.message || "",
    );

    if (sqlLimitError) {
      return res.status(sqlLimitError.statusCode).json({
        status: false,
        success: false,
        code: sqlLimitError.code,
        message: sqlLimitError.message,
        data: sqlLimitError.data,
      });
    }

    return res.status(400).json({
      status: false,
      message: getClientMessage(typedError),
    });
  }
}
