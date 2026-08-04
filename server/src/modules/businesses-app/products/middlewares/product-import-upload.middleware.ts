import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { securityConfig } from "@/config/security.config.js";

const allowedExtensions = [".xlsx", ".xls"];
const allowedMimeTypes = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
];

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    allowedExtensions.includes(extension) &&
    allowedMimeTypes.includes(file.mimetype)
  ) {
    callback(null, true);
    return;
  }

  callback(new Error("INVALID_FILE_TYPE"));
}

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: securityConfig.uploadMaxFileSizeMb * 1024 * 1024,
    files: 1,
    fields: 0,
  },
  fileFilter,
}).single("file");

export function productImportUploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  uploadMiddleware(req, res, function handleUploadError(error: unknown) {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        status: "ERROR",
        code: "FILE_TOO_LARGE",
        message: "El archivo supera el tamano permitido.",
        data: null,
      });
      return;
    }

    if (
      error instanceof multer.MulterError &&
      (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_FIELD_COUNT")
    ) {
      res.status(400).json({
        success: false,
        status: "ERROR",
        code: "INVALID_IMPORT_FILE",
        message: "Solo se permite enviar un archivo Excel.",
        data: null,
      });
      return;
    }

    if (error instanceof Error && error.message === "INVALID_FILE_TYPE") {
      res.status(400).json({
        success: false,
        status: "ERROR",
        code: "INVALID_FILE_TYPE",
        message: "Solo se permiten archivos Excel .xlsx o .xls.",
        data: null,
      });
      return;
    }

    next(error);
  });
}
