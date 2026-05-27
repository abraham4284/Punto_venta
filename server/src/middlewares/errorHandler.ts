import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(error);

  res.status(400).json({
    status: "ERROR",
    message: error.message || "Error interno del servidor",
    data: null,
  });
};