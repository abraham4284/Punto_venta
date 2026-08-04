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

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function moneySchema(fieldName: string) {
  return z
    .number({ error: `${fieldName} es obligatorio` })
    .min(0, `${fieldName} no puede ser negativo`)
    .multipleOf(0.01, `${fieldName} debe tener como maximo 2 decimales`);
}

const idBusinessSchema = z
  .number({ error: "El negocio es obligatorio" })
  .int("El negocio debe ser un numero entero")
  .positive("El negocio debe ser valido");

const idUserSchema = z
  .number({ error: "El usuario es obligatorio" })
  .int("El usuario debe ser un numero entero")
  .positive("El usuario debe ser valido");

const idPurchaseSchema = z
  .number({ error: "La compra es obligatoria" })
  .int("La compra debe ser un numero entero")
  .positive("La compra debe ser valida");

export const createPurchaseDetailSchema = z
  .object({
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

    unitPrice: moneySchema("El precio unitario"),

    discountAmount: moneySchema("El descuento"),

    subtotal: moneySchema("El subtotal del item"),
  })
  .strict()
  .refine(
    function validateItemSubtotal(data) {
      return (
        roundMoney(data.quantity * data.unitPrice - data.discountAmount) ===
        data.subtotal
      );
    },
    {
      message:
        "El subtotal del item debe coincidir con cantidad x precio menos descuento",
      path: ["subtotal"],
    },
  );

export const createPurchaseSchema = z
  .object({
    idBusiness: idBusinessSchema,
    idUser: idUserSchema,
    idSupplier: nullablePositiveIntSchema,
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
    details: z
      .array(createPurchaseDetailSchema, {
        error: "La compra debe incluir productos",
      })
      .min(1, "La compra debe incluir al menos un producto")
      .max(100, "La compra no puede superar los 100 productos"),
  })
  .strict()
  .superRefine(function validatePurchaseMath(data, ctx) {
    const calculatedSubtotal = roundMoney(
      data.details.reduce(function sumSubtotal(acc, item) {
        return acc + item.quantity * item.unitPrice;
      }, 0),
    );
    const calculatedDiscount = roundMoney(
      data.details.reduce(function sumDiscount(acc, item) {
        return acc + item.discountAmount;
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

export const purchaseIdParamSchema = z
  .object({
    idBusiness: idBusinessSchema,
    idPurchase: idPurchaseSchema,
  })
  .strict();
