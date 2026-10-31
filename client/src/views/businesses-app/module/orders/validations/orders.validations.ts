import { z } from "zod";
import { Decimal } from "decimal.js";

const id = z.number({ error: "Seleccioná una opción válida" }).int("El identificador debe ser entero").positive("Seleccioná una opción válida").max(2147483647);
const money = z.number({ error: "Ingresá un importe válido" }).min(0, "El importe no puede ser negativo").max(999999999999.99, "El importe supera el máximo permitido").refine((n) => new Decimal(n).decimalPlaces() <= 2, "Usá como máximo 2 decimales");
export const orderPayloadSchema = z.object({
  idCustomer: id, idDeposit: id, expectedPaymentMethodId: id.nullable().optional(),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  delivery: z.object({ recipientName: z.string().trim().min(2, "Ingresá el nombre del destinatario (2 caracteres o más)").max(240), recipientPhone: z.string().trim().min(1, "Ingresá el teléfono del destinatario").max(80),
    address: z.string().trim().min(3, "Ingresá la dirección de entrega (3 caracteres o más)").max(255), reference: z.string().trim().max(500).nullable().optional() }).strict().nullable().optional(),
  observation: z.string().trim().max(500).nullable().optional(), deliveryFee: money,
  subtotal: money, discountTotal: money, total: money,
  items: z.array(z.object({ idProduct: id, quantity: z.number({ error: "Ingresá una cantidad válida" }).positive("La cantidad debe ser mayor a cero").max(999999999).refine((n) => new Decimal(n).decimalPlaces() <= 2, "Usá como máximo 2 decimales"),
    unitPrice: money, discount: money, total: money }).strict()).min(1, "Agregá al menos un producto").max(100),
}).strict().superRefine((data, ctx) => {
  if (data.fulfillmentType === "DELIVERY" && !data.delivery) ctx.addIssue({ code: "custom", path: ["delivery"], message: "Completá los datos de entrega" });
  if (data.fulfillmentType === "PICKUP" && (data.delivery != null || data.deliveryFee !== 0)) ctx.addIssue({ code: "custom", path: ["delivery"], message: "Retiro no admite entrega ni costo" });
  const seen = new Set<number>(); let subtotal = new Decimal(0); let discount = new Decimal(0);
  data.items.forEach((item, index) => {
    if (seen.has(item.idProduct)) ctx.addIssue({ code: "custom", path: ["items", index, "idProduct"], message: "Producto repetido" });
    seen.add(item.idProduct);
    const gross = new Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const total = gross.minus(item.discount);
    if (total.lt(0) || !total.eq(item.total)) ctx.addIssue({ code: "custom", path: ["items", index, "total"], message: "Revisá el descuento y el total de la línea" });
    subtotal = subtotal.plus(gross); discount = discount.plus(item.discount);
  });
  if (!subtotal.eq(data.subtotal) || !discount.eq(data.discountTotal) || !subtotal.minus(discount).plus(data.deliveryFee).eq(data.total)) {
    ctx.addIssue({ code: "custom", path: ["total"], message: "Los totales no coinciden con las líneas" });
  }
});
export const orderCancellationSchema = z.object({ reason: z.string().trim().min(3, "Indicá al menos 3 caracteres").max(500) }).strict();
