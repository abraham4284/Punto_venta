import { z } from "zod";

const emptyStringToNull = z.literal("").transform(() => null);

export const depositIdParamSchema = z.object({
  idDeposit: z
    .string()
    .regex(/^\d+$/, "El id del deposito debe ser numerico"),
});

export const createDepositSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre del deposito debe tener al menos 2 caracteres")
      .max(120, "El nombre del deposito no puede superar los 120 caracteres"),

    description: z
      .string()
      .trim()
      .max(255, "La descripcion no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export const updateDepositSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre del deposito debe tener al menos 2 caracteres")
      .max(120, "El nombre del deposito no puede superar los 120 caracteres")
      .optional(),

    description: z
      .string()
      .trim()
      .max(255, "La descripcion no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });
