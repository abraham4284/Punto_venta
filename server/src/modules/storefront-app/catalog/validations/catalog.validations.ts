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
  })
  .strict();

export const publicCatalogProductParamsSchema = z
  .object({
    idProduct: z.coerce
      .number({ error: "El producto debe ser un numero valido" })
      .int("El producto debe ser un numero entero")
      .positive("El producto debe ser valido"),
  })
  .strict();
