import { z } from "zod";

const productBaseSchema = z.object({
  idProductCategory: z
    .string()
    .min(1, "La categoria es obligatoria")
    .refine(
      function isValidCategory(value) {
        return Number(value) > 0;
      },
      "La categoria seleccionada no es valida",
    ),

  barcode: z
    .string()
    .max(120, "El codigo de barras no puede superar los 120 caracteres"),

  name: z
    .string()
    .min(2, "El nombre es obligatorio")
    .max(160, "El nombre no puede superar los 160 caracteres"),

  description: z
    .string()
    .max(255, "La descripcion no puede superar los 255 caracteres"),

  imageUrl: z
    .string()
    .max(500, "La URL de la imagen no puede superar los 500 caracteres"),

  priceCost: z
    .string()
    .min(1, "El precio de costo es obligatorio")
    .refine(
      function isValidPriceCost(value) {
        return Number(value) > 0;
      },
      "El precio de costo debe ser mayor a cero",
    ),

  priceSale: z
    .string()
    .min(1, "El precio de venta es obligatorio")
    .refine(
      function isValidPriceSale(value) {
        return Number(value) > 0;
      },
      "El precio de venta debe ser mayor a cero",
    ),

  stock: z.string().refine(
    function isValidStock(value) {
      return value === "" || Number(value) >= 0;
    },
    {
      message: "El stock no puede ser negativo",
    },
  ),

  stockMin: z.string().refine(
    function isValidStockMin(value) {
      return value === "" || Number(value) >= 0;
    },
    {
      message: "El stock minimo no puede ser negativo",
    },
  ),
});

export const productCreateFormSchema = productBaseSchema.extend({
  idDeposit: z
    .string()
    .min(1, "El deposito es obligatorio")
    .refine(
      function isValidDeposit(value) {
        return Number(value) > 0;
      },
      "El deposito seleccionado no es valido",
    ),
});

export const productUpdateFormSchema = productBaseSchema.omit({
  stock: true,
});

export type ProductCreateFormSchema = z.infer<typeof productCreateFormSchema>;
export type ProductUpdateFormSchema = z.infer<typeof productUpdateFormSchema>;
