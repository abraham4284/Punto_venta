import { z } from "zod";

export interface FieldError {
  field: string;
  message: string;
}

export interface SqlLikeError {
  message?: string;
  sqlMessage?: string;
}

export function getZodFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const sqlError = error as SqlLikeError;
    return sqlError.sqlMessage || sqlError.message || "Error interno";
  }

  return "Error interno";
}

export function getCashErrorStatus(message: string): number {
  const notFoundErrors = new Set([
    "CASH_REGISTER_NOT_FOUND",
    "CASH_SESSION_NOT_FOUND",
  ]);

  const conflictErrors = new Set([
    "CASH_REGISTER_NAME_ALREADY_EXISTS",
    "CASH_REGISTER_HAS_OPEN_SESSION",
    "OPEN_CASH_SESSION_REQUIRED",
    "CASH_SESSION_ALREADY_OPEN",
    "CASH_SESSION_ALREADY_CLOSED",
    "CASH_SESSION_CLOSED",
    "CASH_REGISTER_INACTIVE",
    "CASH_MOVEMENT_REQUIRES_OPEN_SESSION",
    "CLOSED_CASH_SESSION_SALE_CANNOT_BE_CANCELLED",
  ]);

  if (notFoundErrors.has(message)) return 404;
  if (conflictErrors.has(message)) return 409;
  return 400;
}

export function parseOptionalPositiveInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseOptionalDate(value: unknown, endOfDay: boolean): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
