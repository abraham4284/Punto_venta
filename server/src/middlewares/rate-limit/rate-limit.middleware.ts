import type { Request } from "express";
import rateLimit, { ipKeyGenerator as expressIpKeyGenerator } from "express-rate-limit";
import { rateLimitConfig } from "@/config/rate-limit.config.js";

function rateLimitResponse(message: string) {
  return {
    success: false,
    status: "ERROR",
    code: "RATE_LIMIT_EXCEEDED",
    message,
    data: null,
  };
}

function ipKeyGenerator(req: Request): string {
  return expressIpKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
}

export const globalApiRateLimiter = rateLimit({
  windowMs: rateLimitConfig.global.windowMs,
  max: rateLimitConfig.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiadas solicitudes. Intenta nuevamente mas tarde.",
  ),
});

export const businessLoginRateLimiter = rateLimit({
  windowMs: rateLimitConfig.businessLogin.windowMs,
  max: rateLimitConfig.businessLogin.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiados intentos de inicio de sesion. Intenta nuevamente mas tarde.",
  ),
});

export const platformLoginRateLimiter = rateLimit({
  windowMs: rateLimitConfig.platformLogin.windowMs,
  max: rateLimitConfig.platformLogin.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiados intentos de acceso a plataforma. Intenta nuevamente mas tarde.",
  ),
});

export const registerRateLimiter = rateLimit({
  windowMs: rateLimitConfig.register.windowMs,
  max: rateLimitConfig.register.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiados registros desde esta red. Intenta nuevamente mas tarde.",
  ),
});

export const refreshRateLimiter = rateLimit({
  windowMs: rateLimitConfig.refresh.windowMs,
  max: rateLimitConfig.refresh.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiadas solicitudes de renovacion de sesion. Intenta nuevamente mas tarde.",
  ),
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: rateLimitConfig.passwordReset.windowMs,
  max: rateLimitConfig.passwordReset.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req) {
    const actor = req.auth?.idUser ?? "anonymous";
    return `${actor}:${ipKeyGenerator(req)}`;
  },
  message: rateLimitResponse(
    "Demasiados restablecimientos de contrasena. Intenta nuevamente mas tarde.",
  ),
});

export const importRateLimiter = rateLimit({
  windowMs: rateLimitConfig.import.windowMs,
  max: rateLimitConfig.import.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req) {
    const business = req.user?.idBusiness ?? "unknown-business";
    const user = req.user?.idUser ?? "unknown-user";
    return `${business}:${user}`;
  },
  message: rateLimitResponse(
    "Demasiadas importaciones. Intenta nuevamente mas tarde.",
  ),
});
