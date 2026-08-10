function getRateLimitNumber(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === "") return fallback;

  const parsed = Number(rawValue);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} debe ser un numero entero positivo`);
  }

  return parsed;
}

export const rateLimitConfig = {
  global: {
    windowMs: getRateLimitNumber("GLOBAL_RATE_LIMIT_WINDOW_MS", 900000),
    max: getRateLimitNumber("GLOBAL_RATE_LIMIT_MAX", 1000),
  },
  businessLogin: {
    windowMs: getRateLimitNumber("BUSINESS_LOGIN_RATE_LIMIT_WINDOW_MS", 900000),
    max: getRateLimitNumber("BUSINESS_LOGIN_RATE_LIMIT_MAX", 10),
  },
  platformLogin: {
    windowMs: getRateLimitNumber("PLATFORM_LOGIN_RATE_LIMIT_WINDOW_MS", 900000),
    max: getRateLimitNumber("PLATFORM_LOGIN_RATE_LIMIT_MAX", 5),
  },
  register: {
    windowMs: getRateLimitNumber("REGISTER_RATE_LIMIT_WINDOW_MS", 3600000),
    max: getRateLimitNumber("REGISTER_RATE_LIMIT_MAX", 5),
  },
  refresh: {
    windowMs: getRateLimitNumber("REFRESH_RATE_LIMIT_WINDOW_MS", 900000),
    max: getRateLimitNumber("REFRESH_RATE_LIMIT_MAX", 60),
  },
  passwordReset: {
    windowMs: getRateLimitNumber("PASSWORD_RESET_RATE_LIMIT_WINDOW_MS", 3600000),
    max: getRateLimitNumber("PASSWORD_RESET_RATE_LIMIT_MAX", 10),
  },
  import: {
    windowMs: getRateLimitNumber("IMPORT_RATE_LIMIT_WINDOW_MS", 3600000),
    max: getRateLimitNumber("IMPORT_RATE_LIMIT_MAX", 5),
  },
};
