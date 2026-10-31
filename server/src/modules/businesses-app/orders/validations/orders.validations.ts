import { z } from "zod";
import { Decimal } from "decimal.js";
import { calculateOrderTotals } from "../helpers/orders.helper.js";

export const orderIdSchema = z.coerce.number().int().positive().max(2147483647);
export const orderKeySchema = z.string().trim().uuid().max(64);
const bodyId = z.number().int().positive().max(2147483647);
const money = z
  .number()
  .min(0)
  .max(999999999999.99)
  .refine(function cents(value) {
    return new Decimal(value).decimalPlaces() <= 2;
  }, "El importe admite como maximo 2 decimales");
const optionalText = z.string().trim().max(500).nullable().optional();
const deliverySchema = z
  .object({
    recipientName: z.string().trim().min(2).max(240),
    recipientPhone: z.string().trim().min(1).max(80),
    address: z.string().trim().min(3).max(255),
    reference: optionalText,
  })
  .strict();

export const orderBodySchema = z
  .object({
    idCustomer: bodyId,
    idDeposit: bodyId,
    expectedPaymentMethodId: bodyId.nullable().optional(),
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    delivery: deliverySchema.nullable().optional(),
    observation: optionalText,
    deliveryFee: money.default(0),
    subtotal: money,
    discountTotal: money,
    total: money,
    items: z
      .array(
        z
          .object({
            idProduct: bodyId,
            quantity: z
              .number()
              .positive()
              .max(999999999)
              .refine(function precision(value) {
                return new Decimal(value).decimalPlaces() <= 2;
              }, "La cantidad admite como maximo 2 decimales"),
            unitPrice: money,
            discount: money,
            total: money,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine(function validateOrder(data, ctx) {
    if (data.fulfillmentType === "DELIVERY" && !data.delivery) {
      ctx.addIssue({
        code: "custom",
        path: ["delivery"],
        message: "La entrega requiere destinatario, telefono y direccion",
      });
    }
    if (
      data.fulfillmentType === "PICKUP" &&
      (data.delivery != null || data.deliveryFee !== 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["delivery"],
        message: "Retiro no admite datos ni costo de entrega",
      });
    }
    const seen = new Set<number>();
    const totals = calculateOrderTotals(data.items, data.deliveryFee);
    data.items.forEach(function validateItem(item, i) {
      if (seen.has(item.idProduct))
        ctx.addIssue({
          code: "custom",
          path: ["items", i, "idProduct"],
          message: "Producto repetido",
        });
      seen.add(item.idProduct);
      if (
        totals.lineTotals[i] < 0 ||
        !new Decimal(item.total).eq(totals.lineTotals[i])
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["items", i, "total"],
          message: "Total de linea invalido",
        });
      }
    });
    for (const field of ["subtotal", "discountTotal", "total"] as const) {
      if (!new Decimal(data[field]).eq(totals[field]))
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "El total no coincide con las lineas",
        });
    }
  });

export const orderStatusSchema = z
  .object({ status: z.enum(["CONFIRMED", "PREPARING", "READY"]) })
  .strict();
export const orderCancelSchema = z
  .object({ reason: z.string().trim().min(3).max(500) })
  .strict();
export const orderProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(160).optional(),
  })
  .strict();
export const orderFiltersSchema = orderProductsQuerySchema
  .extend({
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED",
      ])
      .optional(),
    idCustomer: orderIdSchema.optional(),
    idDeposit: orderIdSchema.optional(),
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]).optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
  })
  .superRefine(function dateRange(data, ctx) {
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "Rango de fechas invalido",
      });
    }
  });
