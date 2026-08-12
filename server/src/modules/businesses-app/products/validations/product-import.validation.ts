import { z } from "zod";

const productUnitTypeSchema = z.enum(["UNIT", "KG", "GRAM", "LITER", "METER"], {
  error: "La unidad de medida no es valida",
});

export const productImportRowSchema = z
  .object({
    rowNumber: z.number().int().positive(),
    barcode: z
      .string()
      .trim()
      .max(100, "El codigo de barras no puede superar los 100 caracteres")
      .nullable(),
    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(160, "El nombre no puede superar los 160 caracteres"),
    description: z
      .string()
      .trim()
      .max(255, "La descripcion no puede superar los 255 caracteres")
      .nullable(),
    imageUrl: z
      .string()
      .trim()
      .max(500, "La URL de imagen no puede superar los 500 caracteres")
      .nullable(),
    categoryName: z
      .string({ error: "La categoria es obligatoria" })
      .trim()
      .min(1, "La categoria es obligatoria"),
    depositName: z
      .string({ error: "El deposito es obligatorio" })
      .trim()
      .min(1, "El deposito es obligatorio"),
    priceCost: z.number().min(0, "El precio de costo no puede ser negativo"),
    priceSale: z.number().min(0, "El precio de venta no puede ser negativo"),
    priceWholesale: z
      .number()
      .min(0, "El precio mayorista no puede ser negativo")
      .nullable(),
    unitType: productUnitTypeSchema,
    stockMin: z.number().min(0, "El stock minimo no puede ser negativo"),
    initialStock: z
      .number()
      .min(0, "El stock inicial no puede ser negativo"),
    isActive: z.boolean(),
  })
  .strict();

export const confirmProductImportSchema = z
  .object({
    importToken: z
      .string({ error: "El token de importacion es obligatorio" })
      .trim()
      .min(1, "El token de importacion es obligatorio"),
    importMode: z.enum(["CREATE_ONLY", "UPDATE_EXISTING"], {
      error: "El modo de importacion no es valido",
    }),
    existingStockMode: z
      .enum(["SKIP_EXISTING_STOCK", "ADD_TO_EXISTING_STOCK"], {
        error: "El tratamiento del stock existente no es valido",
      })
      .default("SKIP_EXISTING_STOCK"),
    importValidRowsOnly: z.boolean({
      error: "La opcion de filas validas es obligatoria",
    }),
  })
  .strict();
