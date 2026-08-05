import type { Request, Response, NextFunction } from "express";
import { isAppError } from "@/helpers/app-error.helper.js";
import {
  createLimitErrorFromSqlMessage,
  isSubscriptionResourceLimitError,
} from "@/modules/businesses-app/subscription/services/subscription-limits.service.js";

interface DatabaseError {
  code?: string;
  sqlMessage?: string;
  errno?: number;
  sqlState?: string;
}

function isDatabaseError(error: unknown): error is Error & DatabaseError {
  if (!(error instanceof Error)) return false;

  const candidate = error as DatabaseError;

  return Boolean(
    candidate.sqlMessage ||
      candidate.sqlState ||
      candidate.code?.startsWith("ER_"),
  );
}

function logSafeError(error: unknown, req: Request): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
    return;
  }

  const candidate = error instanceof Error ? error : new Error("Unknown error");
  const dbError = isDatabaseError(candidate) ? candidate : null;

  console.error({
    method: req.method,
    path: req.originalUrl,
    idUser: req.user?.idUser ?? req.auth?.idUser ?? null,
    idBusiness: req.user?.idBusiness ?? null,
    errorName: candidate.name,
    errorCode: dbError?.code,
  });
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logSafeError(error, req);

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

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      success: false,
      status: "ERROR",
      code: error.code,
      message: error.message,
      data: error.data ?? null,
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

  res.status(500).json({
    success: false,
    status: "ERROR",
    code: "INTERNAL_SERVER_ERROR",
    message: "Ocurrio un error interno.",
    data: null,
  });
}
