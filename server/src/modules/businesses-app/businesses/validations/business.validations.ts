import { z } from "zod";

const emptyStringToNull = z.literal("").transform(() => null);

export const updateBusinessSchema = z
  .object({
    wholesaleEnabled: z.boolean().optional(),
    wholesaleMinimumAmount: z.number().positive().max(999999999999.99).multipleOf(0.01).nullable().optional(),
    name: z
      .string()
      .trim()
      .min(2, "El nombre del negocio debe tener al menos 2 caracteres")
      .max(160, "El nombre del negocio no puede superar los 160 caracteres")
      .optional(),

    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "El slug del negocio debe tener al menos 2 caracteres")
      .max(180, "El slug del negocio no puede superar los 180 caracteres")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalido")
      .optional(),

    logoUrl: z
      .string()
      .trim()
      .url("La URL del logo no es valida")
      .max(500, "La URL del logo no puede superar los 500 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    businessType: z
      .string()
      .trim()
      .min(2, "El tipo de negocio debe tener al menos 2 caracteres")
      .max(100, "El tipo de negocio no puede superar los 100 caracteres")
      .optional(),
  })
  .strict()
  .superRefine(function validateWholesalePolicy(data, ctx) {
    if ((data.wholesaleEnabled !== undefined) !== (data.wholesaleMinimumAmount !== undefined)) {
      ctx.addIssue({ code: "custom", path: ["wholesaleMinimumAmount"], message: "Enviar wholesaleEnabled y wholesaleMinimumAmount juntos" });
    }
    if (data.wholesaleEnabled === true && data.wholesaleMinimumAmount == null) {
      ctx.addIssue({ code: "custom", path: ["wholesaleMinimumAmount"], message: "El minimo mayorista habilitado debe ser positivo" });
    }
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });
