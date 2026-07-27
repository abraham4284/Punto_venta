import type { Request, Response, NextFunction } from "express";
import {
  createLimitErrorFromSqlMessage,
  isSubscriptionResourceLimitError,
} from "@/modules/businesses-app/subscription/services/subscription-limits.service.js";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(error);

  if (isSubscriptionResourceLimitError(error)) {
    res.status(error.statusCode).json({
      success: false,
      status: "ERROR",
      code: error.code,
      message: error.message,
      data: error.data,
    });
    return;
  }

  const sqlLimitError = createLimitErrorFromSqlMessage(error.message);

  if (sqlLimitError) {
    res.status(sqlLimitError.statusCode).json({
      success: false,
      status: "ERROR",
      code: sqlLimitError.code,
      message: sqlLimitError.message,
      data: sqlLimitError.data,
    });
    return;
  }

  res.status(400).json({
    status: "ERROR",
    message: error.message || "Error interno del servidor",
    data: null,
  });
}
