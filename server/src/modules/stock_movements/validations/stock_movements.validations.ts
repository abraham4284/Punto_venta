import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

const observationSchema = z
  .string()
  .trim()
  .max(255, "La observacion no puede superar los 255 caracteres")
  .optional()
  .nullable()
  .or(emptyStringToNull);

export const processStockAdjustmentSchema = z
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
      .int("La cantidad debe ser un numero entero")
      .positive("La cantidad debe ser mayor a cero"),

    type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"], {
      error: "El tipo de ajuste debe ser ADJUSTMENT_IN o ADJUSTMENT_OUT",
    }),

    observation: observationSchema,
  })
  .strict();

export const processStockTransferSchema = z
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

    idDepositFrom: z
      .number({ error: "El deposito origen es obligatorio" })
      .int("El deposito origen debe ser un numero entero")
      .positive("El deposito origen debe ser valido"),

    idDepositTo: z
      .number({ error: "El deposito destino es obligatorio" })
      .int("El deposito destino debe ser un numero entero")
      .positive("El deposito destino debe ser valido"),

    quantity: z
      .number({ error: "La cantidad es obligatoria" })
      .int("La cantidad debe ser un numero entero")
      .positive("La cantidad debe ser mayor a cero"),

    observation: observationSchema,
  })
  .strict()
  .refine(
    function depositsAreDifferent(data) {
      return data.idDepositFrom !== data.idDepositTo;
    },
    {
      message: "El deposito origen y destino deben ser diferentes",
      path: ["idDepositTo"],
    },
  );
