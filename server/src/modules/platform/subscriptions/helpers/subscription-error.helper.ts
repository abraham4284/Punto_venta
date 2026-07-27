import type { SubscriptionServiceError } from "../types/index.js";

export function createSubscriptionServiceError(
  message: string,
  statusCode: number,
  code: string,
): SubscriptionServiceError {
  const error = new Error(message) as SubscriptionServiceError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function mapSubscriptionSqlError(error: unknown): never {
  const sqlError = error as { code?: string; sqlMessage?: string; message?: string };
  const message = sqlError.sqlMessage || sqlError.message || "Error de suscripcion";

  if (sqlError.code === "ER_DUP_ENTRY" || message.includes("Duplicate entry")) {
    throw createSubscriptionServiceError(
      "El registro ya existe",
      409,
      "SUBSCRIPTION_DUPLICATED",
    );
  }

  if (message.includes("SUBSCRIPTION_PLAN_CODE_DUPLICATED")) {
    throw createSubscriptionServiceError(
      "El codigo del plan ya esta registrado",
      409,
      "SUBSCRIPTION_PLAN_CODE_DUPLICATED",
    );
  }

  if (message.includes("SUBSCRIPTION_PLAN_NOT_FOUND")) {
    throw createSubscriptionServiceError(
      "Plan de suscripcion no encontrado",
      404,
      "SUBSCRIPTION_PLAN_NOT_FOUND",
    );
  }

  if (message.includes("SUBSCRIPTION_NOT_FOUND")) {
    throw createSubscriptionServiceError(
      "Suscripcion no encontrada",
      404,
      "SUBSCRIPTION_NOT_FOUND",
    );
  }

  if (message.includes("SUBSCRIPTION_ALREADY_EXISTS")) {
    throw createSubscriptionServiceError(
      "El negocio ya tiene una suscripcion vigente",
      409,
      "SUBSCRIPTION_ALREADY_EXISTS",
    );
  }

  if (message.includes("TRIAL_ALREADY_USED")) {
    throw createSubscriptionServiceError(
      "El negocio ya utilizo su periodo de prueba",
      409,
      "TRIAL_ALREADY_USED",
    );
  }

  if (message.includes("PAYMENT_ALREADY_PROCESSED")) {
    throw createSubscriptionServiceError(
      "El pago ya fue procesado",
      409,
      "PAYMENT_ALREADY_PROCESSED",
    );
  }

  if (message.includes("INVALID_PAYMENT_STATUS_TRANSITION")) {
    throw createSubscriptionServiceError(
      "La transicion del estado del pago no es valida",
      409,
      "INVALID_PAYMENT_STATUS_TRANSITION",
    );
  }

  if (message.includes("PAYMENT_NOT_FOUND")) {
    throw createSubscriptionServiceError(
      "Pago de suscripcion no encontrado",
      404,
      "PAYMENT_NOT_FOUND",
    );
  }

  if (message.includes("INVALID_SUBSCRIPTION_TRANSITION")) {
    throw createSubscriptionServiceError(
      "La transicion de suscripcion no es valida",
      409,
      "INVALID_SUBSCRIPTION_TRANSITION",
    );
  }

  throw createSubscriptionServiceError(message, 400, "SUBSCRIPTION_ERROR");
}
