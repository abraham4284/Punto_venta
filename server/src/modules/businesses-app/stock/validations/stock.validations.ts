import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

function emptyToUndefined(value: unknown): unknown {
  return value === "" ? undefined : value;
}

const optionalPositiveInteger = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: "Debe ser un numero" })
    .int("Debe ser un numero entero")
    .positive("Debe ser mayor a cero")
    .optional(),
);

const optionalQuantity = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: "Debe ser un numero" })
    .min(0, "No puede ser negativo")
    .optional(),
);

export const createInitialStockSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idUser: z
      .number({ error: "El usuario es obligatorio" })
      .int("El usuario debe ser un numero entero")
      .positive("El usuario debe ser valido"),

    idProduct: z
      .number({ error: "El producto es obligatorio" })
      .int("El producto debe ser un numero entero")
      .positive("El producto debe ser valido"),

    idDeposit: z
      .number({ error: "El deposito es obligatorio" })
      .int("El deposito debe ser un numero entero")
      .positive("El deposito debe ser valido"),

    quantity: z
      .number({ error: "La cantidad es obligatoria" })
      .min(0, "La cantidad inicial no puede ser negativa"),

    observation: z
      .string()
      .trim()
      .max(255, "La observacion no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),
  })
  .strict();

export const stockPaginationQuerySchema = z
  .object({
    page: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "La pagina debe ser un numero" })
        .int("La pagina debe ser un numero entero")
        .positive("La pagina debe ser mayor a cero")
        .default(1),
    ),
    limit: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "El limite debe ser un numero" })
        .int("El limite debe ser un numero entero")
        .positive("El limite debe ser mayor a cero")
        .max(100, "El limite no puede superar 100 registros")
        .default(15),
    ),
  })
  .strict();

export const advancedStockQuerySchema = z
  .object({
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(160, "La busqueda no puede superar los 160 caracteres").optional(),
    ),
    idDeposit: optionalPositiveInteger,
    quantity: optionalQuantity,
    minQuantity: optionalQuantity,
    maxQuantity: optionalQuantity,
    alertStatus: z.preprocess(
      emptyToUndefined,
      z.enum(["OK", "LOW", "ZERO"], {
        error: "El estado de alerta debe ser OK, LOW o ZERO",
      }).optional(),
    ),
    page: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "La pagina debe ser un numero" })
        .int("La pagina debe ser un numero entero")
        .positive("La pagina debe ser mayor a cero")
        .default(1),
    ),
    limit: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "El limite debe ser un numero" })
        .int("El limite debe ser un numero entero")
        .positive("El limite debe ser mayor a cero")
        .max(100, "El limite no puede superar 100 registros")
        .default(15),
    ),
  })
  .strict()
  .refine(
    function minQuantityIsLowerThanMax(data) {
      if (data.minQuantity === undefined || data.maxQuantity === undefined) {
        return true;
      }

      return data.minQuantity <= data.maxQuantity;
    },
    {
      path: ["minQuantity"],
      message: "La cantidad minima no puede ser mayor a la cantidad maxima",
    },
  );

export const criticalStockReportQuerySchema = z
  .object({
    idDeposit: optionalPositiveInteger,
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(160, "La busqueda no puede superar los 160 caracteres").optional(),
    ),
    alertStatus: z.preprocess(
      emptyToUndefined,
      z.enum(["CRITICAL_ZERO", "CRITICAL_LOW", "CRITICAL_EQUAL"], {
        error: "El estado debe ser CRITICAL_ZERO, CRITICAL_LOW o CRITICAL_EQUAL",
      }).optional(),
    ),
    maxQuantity: optionalQuantity,
  })
  .strict();
