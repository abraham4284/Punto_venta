import type { Request, Response, NextFunction } from "express";
import { securityConfig } from "@/config/security.config.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_HEADER_NAME = "x-csrf-protection";
const CSRF_HEADER_VALUE = "1";

function isPlatformRoute(req: Request): boolean {
  return req.originalUrl.startsWith("/api/platform");
}

function isMutatingRequest(req: Request): boolean {
  return MUTATING_METHODS.has(req.method.toUpperCase());
}

function sendCsrfError(res: Response): void {
  res.status(403).json({
    success: false,
    status: "ERROR",
    code: "CSRF_VALIDATION_FAILED",
    message: "No se pudo validar la seguridad de la solicitud.",
    data: null,
  });
}

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isMutatingRequest(req) || isPlatformRoute(req)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const csrfHeader = req.headers[CSRF_HEADER_NAME];

  if (!origin) {
    next();
    return;
  }

  if (
    origin === "null" ||
    !securityConfig.frontendOrigins.includes(origin) ||
    csrfHeader !== CSRF_HEADER_VALUE
  ) {
    sendCsrfError(res);
    return;
  }

  next();
}
