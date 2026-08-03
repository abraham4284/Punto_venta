import { z } from "zod";

export const cashRegisterIdSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    idCashRegister: z.number().int().positive("La caja debe ser valida"),
  })
  .strict();

export const createCashRegisterSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede superar los 100 caracteres"),
    description: z
      .string()
      .trim()
      .max(255, "La descripcion no puede superar los 255 caracteres")
      .optional()
      .nullable(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updateCashRegisterSchema = createCashRegisterSchema
  .extend({
    idCashRegister: z.number().int().positive("La caja debe ser valida"),
  })
  .strict();

export const changeCashRegisterStatusSchema = z
  .object({
    idBusiness: z.number().int().positive("El negocio debe ser valido"),
    idCashRegister: z.number().int().positive("La caja debe ser valida"),
    isActive: z.boolean({ error: "El estado es obligatorio" }),
  })
  .strict();
