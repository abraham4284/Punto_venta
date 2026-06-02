import { z } from "zod";

export const productFormSchema = z.object({
  idProductCategory: z
    .string()
    .min(1, "La categoría es obligatoria")
    .refine(
      (value) => Number(value) > 0,
      "La categoría seleccionada no es válida"
    ),

  barcode: z
    .string()
    .max(120, "El código de barras no puede superar los 120 caracteres"),

  name: z
    .string()
    .min(2, "El nombre es obligatorio")
    .max(160, "El nombre no puede superar los 160 caracteres"),

  description: z
    .string()
    .max(255, "La descripción no puede superar los 255 caracteres"),

  imageUrl: z
    .string()
    .max(500, "La URL de la imagen no puede superar los 500 caracteres"),

  priceCost: z
    .string()
    .min(1, "El precio de costo es obligatorio")
    .refine(
      (value) => Number(value) > 0,
      "El precio de costo debe ser mayor a cero"
    ),

  priceSale: z
    .string()
    .min(1, "El precio de venta es obligatorio")
    .refine(
      (value) => Number(value) > 0,
      "El precio de venta debe ser mayor a cero"
    ),

  stock: z
    .string()
    .refine((value) => value === "" || Number(value) >= 0, {
      message: "El stock no puede ser negativo",
    }),

  stockMin: z
    .string()
    .refine((value) => value === "" || Number(value) >= 0, {
      message: "El stock mínimo no puede ser negativo",
    }),
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;