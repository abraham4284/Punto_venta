import { z } from "zod";

export interface PlatformModuleError extends Error {
  statusCode: number;
  code: string;
}

export function createPlatformModuleError(
  message: string,
  statusCode: number,
  code: string,
): PlatformModuleError {
  const error = new Error(message) as PlatformModuleError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function getZodFieldErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

export function getPositiveId(value: unknown, field: string): number {
  if (Array.isArray(value)) {
    throw createPlatformModuleError(`${field} debe ser valido`, 400, "INVALID_ID");
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createPlatformModuleError(`${field} debe ser valido`, 400, "INVALID_ID");
  }

  return id;
}

export function mapPlatformSqlError(error: unknown): never {
  const sqlError = error as { code?: string; sqlMessage?: string; message?: string };
  const message =
    sqlError.sqlMessage ||
    sqlError.message ||
    "Error administrativo de plataforma";

  if (sqlError.code === "ER_DUP_ENTRY" || message.includes("Duplicate entry")) {
    throw createPlatformModuleError("El registro ya existe", 409, "DUPLICATED");
  }

  if (message.includes("PLATFORM_BUSINESS_NOT_FOUND")) {
    throw createPlatformModuleError(
      "Negocio no encontrado",
      404,
      "PLATFORM_BUSINESS_NOT_FOUND",
    );
  }

  if (message.includes("PLATFORM_USER_NOT_FOUND")) {
    throw createPlatformModuleError(
      "Usuario de plataforma no encontrado",
      404,
      "PLATFORM_USER_NOT_FOUND",
    );
  }

  if (message.includes("CANNOT_DEACTIVATE_LAST_SUPER_ADMIN")) {
    throw createPlatformModuleError(
      "No se puede desactivar al ultimo SUPER_ADMIN",
      409,
      "CANNOT_DEACTIVATE_LAST_SUPER_ADMIN",
    );
  }

  if (message.includes("CANNOT_DEMOTE_LAST_SUPER_ADMIN")) {
    throw createPlatformModuleError(
      "No se puede degradar al ultimo SUPER_ADMIN",
      409,
      "CANNOT_DEMOTE_LAST_SUPER_ADMIN",
    );
  }

  if (message.includes("PLATFORM_BUSINESS_STATUS_UNCHANGED")) {
    throw createPlatformModuleError(
      "El negocio ya se encuentra en ese estado",
      409,
      "PLATFORM_BUSINESS_STATUS_UNCHANGED",
    );
  }

  throw createPlatformModuleError(message, 400, "PLATFORM_ERROR");
}

export function getControllerErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: "Error de validacion",
        errors: getZodFieldErrors(error),
        data: null,
      },
    };
  }

  if (error instanceof Error && "statusCode" in error && "code" in error) {
    const platformError = error as PlatformModuleError;

    return {
      statusCode: platformError.statusCode,
      body: {
        success: false,
        code: platformError.code,
        message: platformError.message,
        data: null,
      },
    };
  }

  return {
    statusCode: 400,
    body: {
      success: false,
      message: error instanceof Error ? error.message : "Error de plataforma",
      data: null,
    },
  };
}
