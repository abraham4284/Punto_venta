import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .or(emptyStringToNull);

const productUnitTypeSchema = z.enum(["UNIT", "KG", "GRAM", "LITER", "METER"], {
  error: "La unidad de medida seleccionada no es valida",
});

export const createProductSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idProductCategory: z
      .number({ error: "La categoria es obligatoria" })
      .int("La categoria debe ser un numero entero")
      .positive("La categoria debe ser valida"),

    idDeposit: z
      .number({ error: "El deposito es obligatorio" })
      .int("El deposito debe ser un numero entero")
      .positive("El deposito debe ser valido"),

    initialStock: z
      .number({ error: "La cantidad inicial es obligatoria" })
      .min(0, "El stock inicial no puede ser un valor negativo"),

    barcode: z
      .string()
      .trim()
      .max(100, "El codigo de barras no puede superar los 100 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre del producto debe tener al menos 2 caracteres")
      .max(160, "El nombre del producto no puede superar los 160 caracteres"),

    description: optionalText.refine(
      function validateDescription(value) {
        return value === undefined || value === null || value.length <= 255;
      },
      "La descripcion no puede superar los 255 caracteres",
    ),

    imageUrl: z
      .string()
      .trim()
      .url("La URL de la imagen no es valida")
      .max(500, "La URL de la imagen no puede superar los 500 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    priceCost: z
      .number({ error: "El precio de costo es obligatorio" })
      .min(0, "El precio de costo no puede ser negativo"),

    priceSale: z
      .number({ error: "El precio de venta es obligatorio" })
      .min(0, "El precio de venta no puede ser negativo"),

    priceWholesale: z
      .number()
      .min(0, "El precio mayorista no puede ser negativo")
      .optional()
      .nullable(),

    unitType: productUnitTypeSchema.default("UNIT"),

    stockMin: z
      .number()
      .min(0, "El stock minimo no puede ser negativo")
      .optional()
      .default(0),
  })
  .strict();

export const updateProductSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idProduct: z
      .number({ error: "El producto es obligatorio" })
      .int("El producto debe ser un numero entero")
      .positive("El producto debe ser valido"),

    idProductCategory: z
      .number()
      .int("La categoria debe ser un numero entero")
      .positive("La categoria debe ser valida")
      .optional(),

    barcode: z
      .string()
      .trim()
      .max(100, "El codigo de barras no puede superar los 100 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    name: z
      .string()
      .trim()
      .min(2, "El nombre del producto debe tener al menos 2 caracteres")
      .max(160, "El nombre del producto no puede superar los 160 caracteres")
      .optional(),

    description: optionalText.refine(
      function validateDescription(value) {
        return value === undefined || value === null || value.length <= 255;
      },
      "La descripcion no puede superar los 255 caracteres",
    ),

    imageUrl: z
      .string()
      .trim()
      .url("La URL de la imagen no es valida")
      .max(500, "La URL de la imagen no puede superar los 500 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    priceCost: z
      .number()
      .min(0, "El precio de costo no puede ser negativo")
      .optional(),

    priceSale: z
      .number()
      .min(0, "El precio de venta no puede ser negativo")
      .optional(),

    priceWholesale: z
      .number()
      .min(0, "El precio mayorista no puede ser negativo")
      .optional()
      .nullable(),

    unitType: productUnitTypeSchema.optional(),

    stockMin: z
      .number()
      .min(0, "El stock minimo no puede ser negativo")
      .optional(),
  })
  .strict()
  .refine(
    function hasEditableField(data) {
      return Object.keys(data).some(function isEditableField(key) {
        return key !== "idBusiness" && key !== "idProduct";
      });
    },
    {
      message: "Debes enviar al menos un campo para actualizar",
    },
  );

export const updateProductPricesSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idProduct: z
      .number({ error: "El producto es obligatorio" })
      .int("El producto debe ser un numero entero")
      .positive("El producto debe ser valido"),

    priceCost: z
      .number({ error: "El precio de costo es obligatorio" })
      .min(0, "El precio de costo no puede ser negativo"),

    priceSale: z
      .number({ error: "El precio de venta es obligatorio" })
      .min(0, "El precio de venta no puede ser negativo"),

    priceWholesale: z
      .number()
      .min(0, "El precio mayorista no puede ser negativo")
      .optional()
      .nullable(),
  })
  .strict();

export const toggleProductStatusSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idProduct: z
      .number({ error: "El producto es obligatorio" })
      .int("El producto debe ser un numero entero")
      .positive("El producto debe ser valido"),

    isActive: z.boolean({ error: "El estado activo/inactivo es obligatorio" }),
  })
  .strict();
