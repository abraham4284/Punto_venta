import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

export const cashMovementSessionSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    idCashSession: z.number().int().positive("La sesion de caja debe ser valida"),
  })
  .strict();

export const createCashMovementSchema = cashMovementSessionSchema
  .extend({
    idUser: z.number().int().positive("El usuario debe ser valido"),
    movementType: z.enum(["INCOME", "EXPENSE"], {
      error: "El tipo de movimiento no es valido",
    }),
    category: z
      .string({ error: "La categoria es obligatoria" })
      .trim()
      .min(2, "La categoria debe tener al menos 2 caracteres")
      .max(100, "La categoria no puede superar los 100 caracteres"),
    amount: z
      .number({ error: "El importe es obligatorio" })
      .positive("El importe debe ser mayor a cero")
      .multipleOf(0.01, "El importe debe tener como maximo 2 decimales"),
    description: z
      .string()
      .trim()
      .max(500, "La descripcion no puede superar los 500 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),
  })
  .strict();
