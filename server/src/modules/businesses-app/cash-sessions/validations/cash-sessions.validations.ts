import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

export const openCashSessionSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    idUser: z.number().int().positive("El usuario debe ser valido"),
    idCashRegister: z
      .number({ error: "La caja es obligatoria" })
      .int("La caja debe ser un numero entero")
      .positive("La caja debe ser valida"),
    openingAmount: z
      .number({ error: "El monto inicial es obligatorio" })
      .min(0, "El monto inicial no puede ser negativo")
      .multipleOf(0.01, "El monto inicial debe tener como maximo 2 decimales"),
    openingObservation: z
      .string()
      .trim()
      .max(500, "La observacion no puede superar los 500 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),
  })
  .strict();

export const cashSessionIdSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    idCashSession: z.number().int().positive("La sesion de caja debe ser valida"),
  })
  .strict();

export const closeCashSessionSchema = cashSessionIdSchema
  .extend({
    idUser: z.number().int().positive("El usuario debe ser valido"),
    countedCashAmount: z
      .number({ error: "El efectivo contado es obligatorio" })
      .min(0, "El efectivo contado no puede ser negativo")
      .multipleOf(0.01, "El efectivo contado debe tener como maximo 2 decimales"),
    closingObservation: z
      .string()
      .trim()
      .max(500, "La observacion no puede superar los 500 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),
  })
  .strict();
