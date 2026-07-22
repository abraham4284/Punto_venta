import { z } from "zod";

export const productCategoryFormSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(160, "El nombre no puede superar los 160 caracteres"),

  description: z
    .string()
    .max(255, "La descripción no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("")),

  isDefault: z.boolean(),
});

export type ProductCategoryFormSchema = z.infer<
  typeof productCategoryFormSchema
>;