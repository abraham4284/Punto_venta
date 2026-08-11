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

function emptyQueryStringToUndefined(value: unknown): unknown {
  if (value === "" || value === null) {
    return undefined;
  }

  return value;
}

function parseBooleanQuery(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (value === true || value === "true" || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === "0") {
    return false;
  }

  return value;
}

export const getProductsQuerySchema = z
  .object({
    page: z.preprocess(
      emptyQueryStringToUndefined,
      z.coerce
        .number({ error: "La pagina debe ser un numero valido" })
        .int("La pagina debe ser un numero entero")
        .min(1, "La pagina debe ser mayor o igual a 1")
        .default(1),
    ),
    limit: z.preprocess(
      emptyQueryStringToUndefined,
      z.coerce
        .number({ error: "El limite debe ser un numero valido" })
        .int("El limite debe ser un numero entero")
        .min(1, "El limite debe ser mayor o igual a 1")
        .max(100, "El limite no puede superar 100 registros")
        .default(20),
    ),
    search: z
      .preprocess(
        emptyQueryStringToUndefined,
        z.string().trim().max(150, "La busqueda no puede superar 150 caracteres").optional(),
      )
      .transform(function normalizeSearch(value) {
        return value && value.length > 0 ? value : null;
      }),
    idProductCategory: z
      .preprocess(
        emptyQueryStringToUndefined,
        z.coerce
          .number({ error: "La categoria debe ser un numero valido" })
          .int("La categoria debe ser un numero entero")
          .positive("La categoria debe ser valida")
          .optional(),
      )
      .transform(function normalizeCategory(value) {
        return value ?? null;
      }),
    isActive: z
      .preprocess(
        parseBooleanQuery,
        z.boolean({ error: "El estado debe ser verdadero o falso" }).optional(),
      )
      .transform(function normalizeActive(value) {
        return value ?? null;
      }),
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
