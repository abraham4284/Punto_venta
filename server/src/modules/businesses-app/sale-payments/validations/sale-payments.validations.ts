import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

const positiveIntSchema = function positiveIntSchema(fieldName: string) {
  return z
    .number({ error: `${fieldName} es obligatorio` })
    .int(`${fieldName} debe ser un numero entero`)
    .positive(`${fieldName} debe ser valido`);
};

const moneySchema = z
  .number({ error: "El importe es obligatorio" })
  .positive("El importe debe ser mayor a cero")
  .multipleOf(0.01, "El importe debe tener como maximo 2 decimales");

const nullableTextSchema = z
  .string()
  .trim()
  .max(255, "El texto no puede superar los 255 caracteres")
  .optional()
  .nullable()
  .or(emptyStringToNull);

export const salePaymentIdParamSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idSalePayment: positiveIntSchema("El pago"),
  })
  .strict();

export const salePaymentSaleIdParamSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idSale: positiveIntSchema("La venta"),
  })
  .strict();

export const createSalePaymentSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idUser: positiveIntSchema("El usuario"),
    idSale: positiveIntSchema("La venta"),
    idPaymentMethod: positiveIntSchema("El metodo de pago"),
    amount: moneySchema,
    status: z.enum(["PENDING", "CONFIRMED"], {
      error: "El estado del pago no es valido",
    }),
    idCashSession: positiveIntSchema("La sesion de caja").optional().nullable(),
    reference: nullableTextSchema,
    observation: nullableTextSchema,
  })
  .strict();

export const updateSalePaymentSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idUser: positiveIntSchema("El usuario"),
    idSalePayment: positiveIntSchema("El pago"),
    idPaymentMethod: positiveIntSchema("El metodo de pago"),
    amount: moneySchema,
    reference: nullableTextSchema,
    observation: nullableTextSchema,
  })
  .strict();

export const salePaymentActionSchema = z
  .object({
    idBusiness: positiveIntSchema("El negocio"),
    idUser: positiveIntSchema("El usuario"),
    idSalePayment: positiveIntSchema("El pago"),
    idCashSession: positiveIntSchema("La sesion de caja").optional().nullable(),
    idPaymentMethod: positiveIntSchema("El metodo de pago").optional().nullable(),
    reason: nullableTextSchema,
    observation: nullableTextSchema,
  })
  .strict();
