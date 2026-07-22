import { z } from "zod";
import { PRODUCT_UNIT_TYPES } from "../types/products.types";

const productUnitTypeSchema = z.enum(PRODUCT_UNIT_TYPES, {
  error: "La unidad de medida seleccionada no es valida",
});

const productBaseSchema = z.object({
  idProductCategory: z
    .string()
    .min(1, "La categoria es obligatoria")
    .refine(
      (value) => {
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
      (value) => {
        return Number(value) > 0;
      },
      "El precio de costo debe ser mayor a cero",
    ),

  priceSale: z
    .string()
    .min(1, "El precio de venta es obligatorio")
    .refine(
      (value) => {
        return Number(value) > 0;
      },
      "El precio de venta debe ser mayor a cero",
    ),

  unitType: productUnitTypeSchema,

  stock: z.string().refine(
    (value) => {
      return value === "" || Number(value) >= 0;
    },
    {
      message: "El stock inicial no puede ser negativo",
    },
  ),

  stockMin: z.string().refine(
    (value) => {
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
      (value) => {
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
