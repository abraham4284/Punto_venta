import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

export const productCategoryIdParamSchema = z.object({
  idProductCategory: z
    .string()
    .regex(/^\d+$/, "El id de la categoria debe ser numerico"),
});

export const createProductCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre de la categoria debe tener al menos 2 caracteres")
      .max(120, "El nombre de la categoria no puede superar los 120 caracteres"),

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

export const updateProductCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre de la categoria debe tener al menos 2 caracteres")
      .max(120, "El nombre de la categoria no puede superar los 120 caracteres")
      .optional(),

    description: z
      .string()
      .trim()
      .max(255, "La descripcion no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine(
    function hasAtLeastOneField(data) {
      return Object.keys(data).length > 0;
    },
    {
      message: "Debes enviar al menos un campo para actualizar",
    },
  );

export const updateProductCategoryStatusSchema = z
  .object({
    isActive: z.boolean({
      error: "El estado activo/inactivo es obligatorio",
    }),
  })
  .strict();
