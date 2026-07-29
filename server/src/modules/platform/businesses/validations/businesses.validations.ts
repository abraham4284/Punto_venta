import { z } from "zod";

function optionalPositiveId(field: string) {
  return z.preprocess(function normalizeId(value) {
    return value === "" || value === null || value === undefined ? undefined : value;
  }, z.coerce.number().int(`${field} debe ser entero`).positive(`${field} debe ser positivo`).optional());
}

function optionalDate(valueName: string, endOfDay = false) {
  return z.preprocess(function normalizeDate(value) {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value} ${endOfDay ? "23:59:59" : "00:00:00"}`;
    }
    return value;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, `${valueName} debe ser una fecha valida`).optional());
}

export const listPlatformBusinessesQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  businessStatus: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "CANCELLED"]).optional(),
  subscriptionStatus: z
    .enum(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "EXPIRED"])
    .optional(),
  planId: optionalPositiveId("El plan"),
  businessType: z.string().trim().max(100).optional(),
  activityStatus: z
    .enum([
      "ACTIVE_TODAY",
      "ACTIVE_7_DAYS",
      "ACTIVE_30_DAYS",
      "INACTIVE_30_DAYS",
      "NEVER_ACTIVATED",
    ])
    .optional(),
  createdFrom: optionalDate("La fecha desde"),
  createdTo: optionalDate("La fecha hasta", true),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const changePlatformBusinessStatusSchema = z
  .object({
    isActive: z.coerce.boolean({ error: "El estado debe ser valido" }),
    reason: z
      .string({ error: "El motivo es obligatorio" })
      .trim()
      .min(5, "El motivo debe tener al menos 5 caracteres")
      .max(500, "El motivo no puede superar 500 caracteres"),
  })
  .strict();
