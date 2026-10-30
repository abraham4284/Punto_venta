import type { Customer, CustomerDocumentType } from "../types/customers.types";

export const CUSTOMER_DOCUMENT_TYPE_LABELS: Record<CustomerDocumentType, string> = {
  DNI: "DNI",
  CUIL: "CUIL",
  CUIT: "CUIT",
  PASSPORT: "Pasaporte",
  OTHER: "Otro",
};

export const getCustomerDocumentLabel = (customer: Customer): string =>
  customer.documentType && customer.documentNumber
    ? `${CUSTOMER_DOCUMENT_TYPE_LABELS[customer.documentType]} ${customer.documentNumber}`
    : "Sin documento";

export const matchesCustomerSearch = (customer: Customer, search: string): boolean => {
  const value = search.trim().toLocaleLowerCase("es");
  if (!value) return true;
  const fields = [customer.fullName, customer.firstName, customer.lastName,
    customer.documentNumber, customer.phone, customer.email, customer.address];
  if (fields.some((field) => field?.toLocaleLowerCase("es").includes(value))) return true;
  const digits = value.replace(/[\s.-]/g, "");
  return Boolean(customer.documentNumber && customer.documentType &&
    ["DNI", "CUIL", "CUIT"].includes(customer.documentType) &&
    /^\d+$/.test(digits) && customer.documentNumber.includes(digits));
};
