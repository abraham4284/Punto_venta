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

export const cashSettlementIdParamSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idCashSettlement: positiveIntSchema("La liquidacion"),
  })
  .strict();

export const createCashSettlementSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    receivedByUserId: positiveIntSchema("El usuario receptor"),
    collectorUserId: positiveIntSchema("El cadete"),
    idCashSession: positiveIntSchema("La caja"),
    salePaymentIds: z
      .array(positiveIntSchema("El pago"), {
        error: "Debe seleccionar al menos un pago para rendir",
      })
      .min(1, "Debe seleccionar al menos un pago para rendir")
      .superRefine(function validateDuplicatePaymentIds(ids, ctx) {
        const uniqueIds = new Set(ids);

        if (uniqueIds.size !== ids.length) {
          ctx.addIssue({
            code: "custom",
            message: "No se pueden repetir pagos en una misma liquidacion",
          });
        }
      }),
    observation: z
      .string()
      .trim()
      .max(255, "La observacion no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),
  })
  .strict();

export const pendingCashSettlementsQuerySchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    collectorUserId: z.coerce.number().int().positive().optional().nullable(),
  })
  .strict();

export const cashSettlementListQuerySchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(15),
    collectorUserId: z.coerce.number().int().positive().optional().nullable(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
  })
  .strict();
