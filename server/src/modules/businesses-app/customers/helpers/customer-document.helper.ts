import type { CustomerDocumentType } from "../types/index.js";

export function isNumericCustomerDocument(type: CustomerDocumentType): boolean {
  return type === "DNI" || type === "CUIL" || type === "CUIT";
}

export function normalizeCustomerDocument(type: CustomerDocumentType, value: string): string {
  return isNumericCustomerDocument(type)
    ? value.replace(/[\s.-]/g, "")
    : value.trim().toUpperCase();
}
