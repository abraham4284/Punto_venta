import { z } from "zod";
import type { FieldError, SqlLikeError } from "../../cash/helpers/cash-error.helper.js";

export function getPaymentMethodZodErrors(error: z.ZodError): FieldError[] {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export function getPaymentMethodErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const sqlError = error as SqlLikeError;
    return sqlError.sqlMessage || sqlError.message || "Error interno";
  }

  return "Error interno";
}

export function getPaymentMethodErrorStatus(message: string): number {
  const notFoundErrors = new Set(["PAYMENT_METHOD_NOT_FOUND"]);
  const conflictErrors = new Set([
    "PAYMENT_METHOD_NAME_ALREADY_EXISTS",
    "CASH_PAYMENT_METHOD_IS_SYSTEM_MANAGED",
    "CASH_PAYMENT_METHOD_CANNOT_BE_DISABLED",
    "DEFAULT_PAYMENT_METHOD_CANNOT_BE_DISABLED",
    "PAYMENT_METHOD_STATUS_UNCHANGED",
  ]);

  if (notFoundErrors.has(message)) return 404;
  if (conflictErrors.has(message)) return 409;
  return 400;
}
