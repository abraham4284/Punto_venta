export function normalizeImportValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}
