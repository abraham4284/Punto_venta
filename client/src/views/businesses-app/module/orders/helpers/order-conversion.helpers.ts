import { providerPayloadShape, validateProviderPayload } from "../../deliveries/helpers/delivery-provider.helpers";
import Decimal from "decimal.js";
import { z } from "zod";
import { createIdempotencyKey } from "@/helpers/idempotency.helper";
import type { SalePaymentInput, PaymentMethodOption } from "../../sales/types";
import type { Order, OrderRequestError } from "../types/orders.types";

export const initialOrderPayments = (order: Order, methods: PaymentMethodOption[]): SalePaymentInput[] => {
  const active = methods.filter((method) => method.isActive);
  const method = active.find((method) => method.idPaymentMethod === order.expectedPaymentMethodId)
    ?? active.find((method) => method.isDefault) ?? active[0];
  return [{ id: createIdempotencyKey(), idPaymentMethod: method?.idPaymentMethod ?? null, amount: String(order.total), status: order.fulfillmentType === "DELIVERY" ? "PENDING" : "CONFIRMED", reference: "", observation: "" }];
};
export const orderPaymentTotals = (payments: SalePaymentInput[], total: number) => {
  const assigned = payments.reduce((sum, row) => sum.plus(Number.isFinite(Number(row.amount)) ? row.amount || 0 : 0), new Decimal(0));
  return { total, assigned: assigned.toNumber(), pending: Decimal.max(new Decimal(total).minus(assigned), 0).toNumber(), isBalanced: assigned.eq(total) };
};
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
export const orderConversionPayloadSchema = z.object({
  idCashSession: z.number().int().positive("Se requiere una caja abierta"),
  payments: z.array(z.object({
    idPaymentMethod: z.number().int().positive("Seleccioná un método de pago"),
    amount: z.number().positive("El importe debe ser mayor a cero").multipleOf(0.01, "Usá hasta dos decimales"),
    status: z.enum(["PENDING", "CONFIRMED"]), reference: optionalText(100), observation: optionalText(255),
  }).strict()).min(1).max(5),
  delivery: z.object({
    ...providerPayloadShape,
    scheduledAt: z.iso.datetime({ offset: true }).nullable(), observation: optionalText(255),
  }).strict().superRefine(validateProviderPayload).nullable(),
}).strict();

export const conversionErrorMessage = (error: OrderRequestError) => {
  const messages: Record<string, string> = {
    ORDER_NOT_READY: "El pedido ya no está listo para convertir. Revisá su estado actualizado.",
    ORDER_SALE_INCONSISTENT: "El estado del pedido y su venta no coinciden. Revisá el pedido antes de continuar.",
    IDEMPOTENCY_KEY_CONFLICT: "La clave del intento pertenece a otra venta. Revisá la configuración o cancelá y abrí un nuevo intento.",
    OPEN_CASH_SESSION_REQUIRED: "Se requiere una caja abierta. Actualizá la caja antes de reintentar.",
    CASH_SESSION_CLOSED: "La caja se cerró. Actualizá la caja antes de reintentar.",
    CASH_REGISTER_INACTIVE: "La caja está inactiva. Revisá la caja actual.",
    PAYMENT_METHOD_NOT_FOUND: "Un método de pago ya no está disponible. Actualizá los métodos y seleccioná otro.",
    PAYMENT_METHOD_INACTIVE: "Un método de pago está inactivo. Actualizá los métodos y seleccioná otro.",
    DELIVERY_USER_NOT_FOUND: "El cadete ya no está disponible. Actualizá los datos de selección.",
    ORDER_CONCURRENT_CHANGE: "Hubo un cambio concurrente. Revisá el pedido actualizado antes de reintentar.",
  };
  return (error.code && messages[error.code]) || (error.status === 403 ? "No tenés permiso para convertir este pedido." : error.status === 404 ? "El pedido ya no está disponible." : error.message);
};
