import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

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
      .positive("La cantidad inicial debe ser mayor a cero"),

    observation: z
      .string()
      .trim()
      .max(255, "La observacion no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),
  })
  .strict();
