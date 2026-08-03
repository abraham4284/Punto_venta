import { z } from "zod";

export const cashRegisterFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  description: z.string().trim().max(255, "Maximo 255 caracteres").optional(),
  isDefault: z.boolean(),
});

export const openCashSessionFormSchema = z.object({
  idCashRegister: z.coerce.number().int().positive("Seleccione una caja"),
  openingAmount: z.coerce
    .number({ error: "Ingrese un monto valido" })
    .min(0, "El monto inicial no puede ser negativo"),
  openingObservation: z.string().trim().max(500, "Maximo 500 caracteres").optional(),
});

export const closeCashSessionFormSchema = z.object({
  countedCashAmount: z.coerce
    .number({ error: "Ingrese un monto valido" })
    .min(0, "El efectivo contado no puede ser negativo"),
  closingObservation: z.string().trim().max(500, "Maximo 500 caracteres").optional(),
});

export const cashMovementFormSchema = z.object({
  movementType: z.enum(["INCOME", "EXPENSE"], {
    error: "Seleccione un tipo de movimiento",
  }),
  category: z.string().trim().min(2, "La categoria es obligatoria"),
  amount: z.coerce
    .number({ error: "Ingrese un importe valido" })
    .positive("El importe debe ser mayor a cero"),
  description: z.string().trim().max(500, "Maximo 500 caracteres").optional(),
});
