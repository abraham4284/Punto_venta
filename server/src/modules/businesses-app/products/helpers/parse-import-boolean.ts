import { normalizeImportValue } from "./normalize-import-value.js";

export function parseImportBoolean(value: unknown, fallback: boolean): boolean {
  const normalized = normalizeImportValue(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["si", "sí", "s", "1", "true", "verdadero", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["no", "n", "0", "false", "falso"].includes(normalized)) {
    return false;
  }

  return fallback;
}
