import { z } from "zod";
import { isNumericCustomerDocument, normalizeCustomerDocument } from "../helpers/customer-document.helper.js";
import type { CustomerDocumentType } from "../types/index.js";

function emptyStringToNull(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function optionalString(max: number, label: string) {
  return z.preprocess(emptyStringToNull, z.string().trim().max(max, `${label} no puede superar ${max} caracteres`).nullable().optional());
}

const businessId = z.number().int().positive("El negocio debe ser valido");
const customerId = z.number().int().positive("El cliente debe ser valido");
const firstName = z.string({ error: "El nombre es obligatorio" }).trim().min(2, "El nombre debe tener al menos 2 caracteres").max(120, "El nombre no puede superar 120 caracteres");
const lastName = z.string({ error: "El apellido es obligatorio" }).trim().min(2, "El apellido debe tener al menos 2 caracteres").max(120, "El apellido no puede superar 120 caracteres");
const optionalFields = {
  documentType: z.preprocess(emptyStringToNull, z.enum(["DNI", "CUIL", "CUIT", "PASSPORT", "OTHER"], { error: "El tipo de documento no es valido" }).nullable().optional()),
  documentNumber: z.preprocess(emptyStringToNull, z.string().nullable().optional()),
  phone: optionalString(80, "El telefono"),
  email: z.preprocess(emptyStringToNull, z.string().trim().email("El email del cliente no es valido").max(160, "El email no puede superar 160 caracteres").nullable().optional()),
  address: optionalString(255, "La direccion"),
  observation: optionalString(255, "La observacion"),
};

interface DocumentFields {
  documentType?: CustomerDocumentType | null;
  documentNumber?: string | null;
}

function normalizeDocumentFields<T extends DocumentFields>(data: T, ctx: z.RefinementCtx): T {
  const type = data.documentType;
  const number = data.documentNumber;
  if (type == null && number == null) return data;
  if (type == null || number == null) {
    ctx.addIssue({ code: "custom", path: [type == null ? "documentType" : "documentNumber"], message: "Debe indicar el tipo y numero de documento juntos" });
    return data;
  }
  const normalized = normalizeCustomerDocument(type, number);
  if (normalized.length === 0 || normalized.length > 50) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El documento debe tener entre 1 y 50 caracteres luego de normalizar" });
  } else if (isNumericCustomerDocument(type) && !/^\d+$/.test(normalized)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El documento debe contener solo digitos" });
  }
  return { ...data, documentNumber: normalized };
}

export const createCustomerSchema = z.object({
  idBusiness: businessId,
  firstName,
  lastName,
  ...optionalFields,
}).strict().transform(normalizeDocumentFields);

export const updateCustomerSchema = z.object({
  idBusiness: businessId,
  idCustomer: customerId,
  firstName: firstName.optional(),
  lastName: lastName.optional(),
  ...optionalFields,
}).strict().superRefine(function validateUpdate(data, ctx) {
  if (Object.hasOwn(data, "documentType") !== Object.hasOwn(data, "documentNumber")) {
    ctx.addIssue({ code: "custom", path: [Object.hasOwn(data, "documentType") ? "documentNumber" : "documentType"], message: "Para actualizar el documento debe enviar ambos campos, o ambos null para limpiarlos" });
  }
  if (!Object.entries(data).some(function hasValue([key, value]) {
    return key !== "idBusiness" && key !== "idCustomer" && value !== undefined;
  })) {
    ctx.addIssue({ code: "custom", path: [], message: "Debes enviar al menos un campo para actualizar" });
  }
}).transform(normalizeDocumentFields);

export const customerSearchSchema = z.object({
  search: z.string().trim().min(1, "La busqueda no puede estar vacia").max(160, "La busqueda no puede superar 160 caracteres").optional(),
}).strict();

export const toggleCustomerStatusSchema = z.object({
  idBusiness: businessId,
  idCustomer: customerId,
  isActive: z.boolean({ error: "El estado activo/inactivo es obligatorio" }),
}).strict();
