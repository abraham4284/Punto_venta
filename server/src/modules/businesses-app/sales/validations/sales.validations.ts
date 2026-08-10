import { z } from "zod";

const emptyStringToNull = z.literal("").transform(function transformEmptyString() {
  return null;
});

const nullablePositiveIntSchema = z
  .number({ error: "El identificador debe ser un numero" })
  .int("El identificador debe ser un numero entero")
  .positive("El identificador debe ser valido")
  .optional()
  .nullable()
  .or(emptyStringToNull);

const moneySchema = function moneySchema(fieldName: string) {
  return z
    .number({ error: `${fieldName} es obligatorio` })
    .min(0, `${fieldName} no puede ser negativo`)
    .multipleOf(0.01, `${fieldName} debe tener como maximo 2 decimales`);
};

const idempotencyKeySchema = z
  .string({ error: "IDEMPOTENCY_KEY_REQUIRED" })
  .trim()
  .uuid("INVALID_IDEMPOTENCY_KEY")
  .max(64, "INVALID_IDEMPOTENCY_KEY");

const roundMoney = function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const createSaleDetailSchema = z
  .object({
    idProduct: z
      .number({ error: "El producto es obligatorio" })
      .int("El producto debe ser un numero entero")
      .positive("El producto debe ser valido"),

    quantity: z
      .number({ error: "La cantidad es obligatoria" })
      .positive("La cantidad debe ser mayor a cero"),

    unitPrice: moneySchema("El precio unitario").positive(
      "El precio unitario debe ser mayor a cero",
    ),

    discount: moneySchema("El descuento"),

    total: moneySchema("El total del item"),
  })
  .strict()
  .refine(
    function validateItemTotal(data) {
      return roundMoney(data.quantity * data.unitPrice - data.discount) === data.total;
    },
    {
      message: "El total del item debe coincidir con cantidad x precio menos descuento",
      path: ["total"],
    },
  );

export const createSaleSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),

    idUser: z
      .number({ error: "El usuario es obligatorio" })
      .int("El usuario debe ser un numero entero")
      .positive("El usuario debe ser valido"),

    idCustomer: nullablePositiveIntSchema,

    idDeposit: z
      .number({ error: "El deposito es obligatorio" })
      .int("El deposito debe ser un numero entero")
      .positive("El deposito debe ser valido"),

    idCashSession: z
      .number({ error: "La sesion de caja es obligatoria" })
      .int("La sesion de caja debe ser un numero entero")
      .positive("Debe existir una caja abierta para registrar la venta"),

    idPaymentMethod: z
      .number({ error: "Selecciona un metodo de pago" })
      .int("El metodo de pago debe ser un numero entero")
      .positive("Selecciona un metodo de pago valido"),

    subtotal: moneySchema("El subtotal"),

    discountTotal: moneySchema("El descuento total"),

    total: moneySchema("El total"),

    observation: z
      .string()
      .trim()
      .max(255, "La observacion no puede superar los 255 caracteres")
      .optional()
      .nullable()
      .or(emptyStringToNull),

    idempotencyKey: idempotencyKeySchema,

    items: z
      .array(createSaleDetailSchema, {
        error: "La venta debe incluir productos",
      })
      .min(1, "La venta debe incluir al menos un producto")
      .max(100, "La venta no puede superar los 100 productos"),
  })
  .strict()
  .superRefine(function validateSaleMath(data, ctx) {
    const calculatedSubtotal = roundMoney(
      data.items.reduce(function sumSubtotal(acc, item) {
        return acc + item.quantity * item.unitPrice;
      }, 0),
    );
    const calculatedDiscount = roundMoney(
      data.items.reduce(function sumDiscount(acc, item) {
        return acc + item.discount;
      }, 0),
    );
    const calculatedTotal = roundMoney(calculatedSubtotal - calculatedDiscount);

    if (calculatedSubtotal !== data.subtotal) {
      ctx.addIssue({
        code: "custom",
        path: ["subtotal"],
        message: "El subtotal no coincide con la suma de los productos",
      });
    }

    if (calculatedDiscount !== data.discountTotal) {
      ctx.addIssue({
        code: "custom",
        path: ["discountTotal"],
        message: "El descuento total no coincide con la suma de descuentos",
      });
    }

    if (calculatedTotal !== data.total) {
      ctx.addIssue({
        code: "custom",
        path: ["total"],
        message: "El total debe coincidir con subtotal menos descuento total",
      });
    }
  });

export const saleIdParamSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),
    idSale: z
      .number({ error: "La venta es obligatoria" })
      .int("La venta debe ser un numero entero")
      .positive("La venta debe ser valida"),
  })
  .strict();

export const productsByDepositSchema = z
  .object({
    idBusiness: z
      .number({ error: "El negocio es obligatorio" })
      .int("El negocio debe ser un numero entero")
      .positive("El negocio debe ser valido"),
    idDeposit: z
      .number({ error: "El deposito es obligatorio" })
      .int("El deposito debe ser un numero entero")
      .positive("El deposito debe ser valido"),
  })
  .strict();
