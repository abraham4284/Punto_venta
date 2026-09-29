import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

const positiveId = z.coerce
  .number({ error: "El identificador debe ser un numero valido" })
  .int("El identificador debe ser un numero entero")
  .positive("El identificador debe ser valido");

export const productImagesProductParamsSchema = z
  .object({
    idProduct: positiveId,
  })
  .strict();

export const productImagesImageParamsSchema = z
  .object({
    idProduct: positiveId,
    idProductImage: positiveId,
  })
  .strict();

export const createProductImageBodySchema = z
  .object({
    imageUrl: z
      .string({ error: "La URL de la imagen es obligatoria" })
      .trim()
      .url("La URL de la imagen no es valida")
      .max(500, "La URL de la imagen no puede superar los 500 caracteres"),
    altText: z
      .string()
      .trim()
      .max(255, "El texto alternativo no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),
  })
  .strict();

export const reorderProductImagesBodySchema = z
  .object({
    imageIds: z
      .array(positiveId, {
        error: "Debes enviar el listado de imagenes ordenadas",
      })
      .max(10, "La galeria del producto no puede superar las 10 imagenes")
      .refine(
        function hasUniqueIds(imageIds) {
          return new Set(imageIds).size === imageIds.length;
        },
        {
          message: "No puedes repetir imagenes en el ordenamiento",
        },
      ),
  })
  .strict();
