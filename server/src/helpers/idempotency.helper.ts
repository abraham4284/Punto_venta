import type { Request } from "express";

const IDEMPOTENCY_KEY_HEADER = "idempotency-key";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return value?.trim() || null;
}

export function getIdempotencyKeyFromRequest(req: Request): string {
  const value = normalizeHeaderValue(req.headers[IDEMPOTENCY_KEY_HEADER]);

  if (!value) {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }

  if (value.length > 64 || !UUID_PATTERN.test(value)) {
    throw new Error("INVALID_IDEMPOTENCY_KEY");
  }

  return value;
}

export function isIdempotencyError(message: string): boolean {
  return (
    message === "IDEMPOTENCY_KEY_REQUIRED" ||
    message === "INVALID_IDEMPOTENCY_KEY"
  );
}
