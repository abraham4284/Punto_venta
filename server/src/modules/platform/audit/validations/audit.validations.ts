import { z } from "zod";

function optionalPositiveId(field: string) {
  return z.preprocess(function normalizeId(value) {
    return value === "" || value === null || value === undefined ? undefined : value;
  }, z.coerce.number().int(`${field} debe ser entero`).positive(`${field} debe ser positivo`).optional());
}

function optionalDateTime(valueName: string) {
  return z.preprocess(function normalizeDate(value) {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value} 00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value.replace("T", " ")}:00`;
    return value;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, `${valueName} debe ser una fecha valida`).optional());
}

export const listPlatformAuditQuerySchema = z.object({
  platformUserId: optionalPositiveId("El usuario platform"),
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(80).optional(),
  entityId: z.string().trim().max(100).optional(),
  idBusiness: optionalPositiveId("El negocio"),
  dateFrom: optionalDateTime("La fecha desde"),
  dateTo: optionalDateTime("La fecha hasta"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});
