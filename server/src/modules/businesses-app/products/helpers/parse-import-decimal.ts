import { normalizeImportValue } from "./normalize-import-value.js";

export function parseImportDecimal(value: unknown): number {
  const normalized = normalizeImportValue(value)
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error("El valor decimal no es valido");
  }

  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}
