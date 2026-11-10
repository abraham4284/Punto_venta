import { z } from "zod";

function getPositiveNumberFromEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === "") return fallback;

  const parsed = Number(rawValue);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} debe ser un numero entero valido`);
  }

  return parsed;
}

function getStringFromEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function getOptionalOrigin(
  value: string | undefined,
  errorMessage = "Las URLs de frontend deben tener formato valido",
): string | null {
  if (!value) return null;

  const validation = z.string().url().safeParse(value);

  if (!validation.success) {
    throw new Error(errorMessage);
  }

  return validation.data;
}

function getStorefrontOrigins(value: string | undefined): string[] {
  const origins: string[] = [];
  for (const entry of (value ?? "").split(",")) {
    const origin = getOptionalOrigin(entry.trim(), "STOREFRONT_URLS: URL con formato invalido");
    if (origin === null) continue;

    const url = new URL(origin);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin !== origin ||
      url.hostname.includes("*")
    ) {
      throw new Error("STOREFRONT_URLS: se esperan origenes HTTP(S) exactos");
    }
    origins.push(origin);
  }
  return origins;
}

const frontendOrigins = [
  getOptionalOrigin(process.env.FRONTEND_URL),
  getOptionalOrigin(process.env.FRONTEND_URL_LOCAL),
  getOptionalOrigin(process.env.STOREFRONT_URL),
  ...getStorefrontOrigins(process.env.STOREFRONT_URLS),
].filter(function filterOrigin(origin): origin is string {
  return Boolean(origin);
});

export const securityConfig = {
  isProduction: process.env.NODE_ENV === "production",
  trustProxyHops: getPositiveNumberFromEnv("TRUST_PROXY_HOPS", 0),
  jsonBodyLimit: getStringFromEnv("JSON_BODY_LIMIT", "1mb"),
  urlEncodedBodyLimit: getStringFromEnv("URL_ENCODED_BODY_LIMIT", "100kb"),
  uploadMaxFileSizeMb: getPositiveNumberFromEnv("UPLOAD_MAX_FILE_SIZE_MB", 5),
  importMaxRows: getPositiveNumberFromEnv("IMPORT_MAX_ROWS", 1000),
  importMaxColumns: getPositiveNumberFromEnv("IMPORT_MAX_COLUMNS", 40),
  importMaxCellLength: getPositiveNumberFromEnv("IMPORT_MAX_CELL_LENGTH", 500),
  frontendOrigins: [...new Set(frontendOrigins)],
};
