import { z } from "zod";

function emptyQueryStringToUndefined(value: unknown): unknown {
  if (value === "" || value === null) {
    return undefined;
  }

  return value;
}

export const publicCatalogProductsQuerySchema = z
  .object({
    page: z.preprocess(
      emptyQueryStringToUndefined,
      z.coerce
        .number({ error: "La pagina debe ser un numero valido" })
        .int("La pagina debe ser un numero entero")
        .positive("La pagina debe ser mayor o igual a 1")
        .default(1),
    ),
    limit: z.preprocess(
      emptyQueryStringToUndefined,
      z.coerce
        .number({ error: "El limite debe ser un numero valido" })
        .int("El limite debe ser un numero entero")
        .positive("El limite debe ser mayor o igual a 1")
        .max(60, "El limite no puede superar 60 registros")
        .default(24),
    ),
    search: z
      .preprocess(
        emptyQueryStringToUndefined,
        z
          .string()
          .trim()
          .max(150, "La busqueda no puede superar 150 caracteres")
          .optional(),
      )
      .transform(function normalizeSearch(value) {
        return value && value.length > 0 ? value : null;
      }),
    categorySlug: z
      .preprocess(
        emptyQueryStringToUndefined,
        z
          .string()
          .trim()
          .min(1, "El slug de categoria no puede estar vacio")
          .max(180, "El slug de categoria no puede superar 180 caracteres")
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug de categoria no es valido")
          .optional(),
      )
      .transform(function normalizeCategory(value) {
        return value ?? null;
      }),
  })
  .strict();

export const publicCatalogProductParamsSchema = z
  .object({
    slug: z
      .string({ error: "El slug del producto es obligatorio" })
      .trim()
      .min(1, "El slug del producto es obligatorio")
      .max(180, "El slug del producto no puede superar 180 caracteres")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug del producto no es valido"),
  })
  .strict();
