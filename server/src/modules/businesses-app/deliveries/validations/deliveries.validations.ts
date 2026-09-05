import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

const positiveIntSchema = function positiveIntSchema(fieldName: string) {
  return z
    .number({ error: `${fieldName} es obligatorio` })
    .int(`${fieldName} debe ser un numero entero`)
    .positive(`${fieldName} debe ser valido`);
};

const nullableTextSchema = z
  .string()
  .trim()
  .max(255, "El texto no puede superar los 255 caracteres")
  .optional()
  .nullable()
  .or(emptyStringToNull);

export const deliveryIdParamSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idSaleDelivery: positiveIntSchema("La entrega"),
  })
  .strict();

export const deliveryAssignSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idSaleDelivery: positiveIntSchema("La entrega"),
    idUser: positiveIntSchema("El usuario"),
    assignedToUserId: positiveIntSchema("El cadete"),
  })
  .strict();

export const deliveryStatusActionSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idSaleDelivery: positiveIntSchema("La entrega"),
    idUser: positiveIntSchema("El usuario"),
    scheduledAt: z.coerce.date().optional().nullable(),
    failureReason: nullableTextSchema,
    observation: nullableTextSchema,
  })
  .strict();

export const deliveryListQuerySchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(15),
    status: z
      .enum(["PENDING", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"])
      .optional()
      .nullable(),
    assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
    search: z.string().trim().max(150).optional().nullable(),
  })
  .strict();
