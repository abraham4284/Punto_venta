import type { Request } from "express";
import rateLimit, {
  MemoryStore,
  ipKeyGenerator as expressIpKeyGenerator,
} from "express-rate-limit";
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

const stores = {
  global: new MemoryStore(),
  businessLogin: new MemoryStore(),
  platformLogin: new MemoryStore(),
  register: new MemoryStore(),
  refresh: new MemoryStore(),
  passwordReset: new MemoryStore(),
  import: new MemoryStore(),
};

export const globalApiRateLimiter = rateLimit({
  windowMs: rateLimitConfig.global.windowMs,
  max: rateLimitConfig.global.max,
  store: stores.global,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiadas solicitudes. Intenta nuevamente mas tarde.",
  ),
});

export const businessLoginRateLimiter = rateLimit({
  windowMs: rateLimitConfig.businessLogin.windowMs,
  max: rateLimitConfig.businessLogin.max,
  store: stores.businessLogin,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiados intentos de inicio de sesion. Intenta nuevamente mas tarde.",
  ),
});

export const platformLoginRateLimiter = rateLimit({
  windowMs: rateLimitConfig.platformLogin.windowMs,
  max: rateLimitConfig.platformLogin.max,
  store: stores.platformLogin,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiados intentos de acceso a plataforma. Intenta nuevamente mas tarde.",
  ),
});

export const registerRateLimiter = rateLimit({
  windowMs: rateLimitConfig.register.windowMs,
  max: rateLimitConfig.register.max,
  store: stores.register,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiados registros desde esta red. Intenta nuevamente mas tarde.",
  ),
});

export const refreshRateLimiter = rateLimit({
  windowMs: rateLimitConfig.refresh.windowMs,
  max: rateLimitConfig.refresh.max,
  store: stores.refresh,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Demasiadas solicitudes de renovacion de sesion. Intenta nuevamente mas tarde.",
  ),
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: rateLimitConfig.passwordReset.windowMs,
  max: rateLimitConfig.passwordReset.max,
  store: stores.passwordReset,
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
  store: stores.import,
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

export async function resetRateLimitStoresForTests(): Promise<void> {
  if (process.env.NODE_ENV !== "test") return;

  await Promise.all(
    Object.values(stores).map(function resetStore(store) {
      return store.resetAll();
    }),
  );
}
