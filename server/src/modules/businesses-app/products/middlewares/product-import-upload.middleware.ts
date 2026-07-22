import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

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

  callback(new Error("Solo se permiten archivos Excel .xlsx o .xls"));
}

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
}).single("file");

export function productImportUploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  uploadMiddleware(req, res, next);
}
