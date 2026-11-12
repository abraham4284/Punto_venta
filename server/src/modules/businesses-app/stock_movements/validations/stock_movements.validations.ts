import { z } from "zod";
import { Decimal } from "decimal.js";

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

const transferId = z.number().int().positive().max(2_147_483_647);

export const processStockTransfersSchema = z.object({
  idDepositFrom: transferId,
  idDepositTo: transferId,
  observation: observationSchema,
  items: z.array(z.object({
    idProduct: transferId,
    quantity: z.number().positive().lt(1e16).refine(
      function fitsStockScale(quantity) { return new Decimal(quantity).decimalPlaces() <= 2; },
      "La cantidad admite hasta dos decimales",
    ),
  }).strict()).min(1).max(100),
}).strict().superRefine(function validateTransfer(data, context) {
  if (data.idDepositFrom === data.idDepositTo) {
    context.addIssue({
      code: "custom",
      path: ["idDepositTo"],
      message: "El deposito origen y destino deben ser diferentes",
    });
  }
  const products = new Set<number>();
  data.items.forEach(function validateItem(item, index) {
    if (products.has(item.idProduct)) {
      context.addIssue({
        code: "custom",
        path: ["items", index, "idProduct"],
        message: "El producto ya esta incluido en la transferencia",
      });
    }
    products.add(item.idProduct);
  });
});

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
