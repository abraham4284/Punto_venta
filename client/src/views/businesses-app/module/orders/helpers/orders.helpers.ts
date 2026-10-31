import { Decimal } from "decimal.js";
import { isAxiosError } from "axios";
import { createIdempotencyKey } from "@/helpers/idempotency.helper";
import type { Order, OrderDraft, OrderDraftLine, OrderRequestError, OrderStatus } from "../types/orders.types";

export const orderStatusLabels: Record<OrderStatus, string> = { PENDING: "Pendiente", CONFIRMED: "Confirmado", PREPARING: "Preparando", READY: "Listo", COMPLETED: "Completado", CANCELLED: "Cancelado" };
export const editableOrder = (status: OrderStatus) => status === "PENDING" || status === "CONFIRMED";
export const cancellableOrder = (status: OrderStatus) => status !== "COMPLETED" && status !== "CANCELLED";
export const nextOrderStep = (status: OrderStatus): { status: "CONFIRMED" | "PREPARING" | "READY"; label: string } | null => {
  if (status === "PENDING") return { status: "CONFIRMED", label: "Confirmar pedido" };
  if (status === "CONFIRMED") return { status: "PREPARING", label: "Comenzar preparación" };
  if (status === "PREPARING") return { status: "READY", label: "Marcar como listo" };
  return null;
};
export const orderMoney = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
export const orderDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("es-AR");
};
export const orderRequestError = (error: unknown): OrderRequestError => {
  if (isAxiosError(error)) {
    const data = error.response?.data as Partial<OrderRequestError> | undefined;
    return { status: error.response?.status, code: data?.code,
      message: data?.message || (error.response ? "No se pudo procesar el pedido." : "No se pudo confirmar el resultado. Reintentá sin modificar el formulario para conservar la clave del pedido."),
      errors: Array.isArray(data?.errors) ? data.errors : [] };
  }
  return { message: "No se pudo procesar el pedido.", errors: [] };
};
export const draftFromOrder = (order?: Order): OrderDraft => ({
  idCustomer: order ? String(order.idCustomer) : "", idDeposit: order ? String(order.idDeposit) : "",
  expectedPaymentMethodId: order?.expectedPaymentMethodId ? String(order.expectedPaymentMethodId) : "",
  fulfillmentType: order?.fulfillmentType ?? "PICKUP", recipientName: order?.delivery?.recipientName ?? "",
  recipientPhone: order?.delivery?.recipientPhone ?? "", address: order?.delivery?.address ?? "",
  reference: order?.delivery?.reference ?? "", deliveryFee: String(order?.deliveryFee ?? 0), observation: order?.observation ?? "",
});
export const linesFromOrder = (order?: Order): OrderDraftLine[] => (order?.items ?? []).map((item) => ({
  idProduct: item.idProduct, productName: item.productName, barcode: item.barcode, unitType: item.unitType,
  productImageUrl: item.productImageUrl ?? null,
  saleMode: item.saleMode, quantity: String(item.quantity), unitPrice: String(item.unitPrice), discount: String(item.discount),
}));
export const draftNumber = (value: string) => value.trim() === "" ? NaN : Number(value);
export const orderUnitQuantityError = (line: Pick<OrderDraftLine, "unitType" | "quantity">) =>
  line.unitType === "UNIT" && !Number.isInteger(draftNumber(line.quantity)) ? "Los productos por unidad requieren una cantidad entera" : null;
export const orderLineTotal = (line: Pick<OrderDraftLine, "quantity" | "unitPrice" | "discount">) => {
  const values = [line.quantity, line.unitPrice, line.discount].map(draftNumber);
  if (!values.every(Number.isFinite)) return { gross: 0, total: 0 };
  const gross = new Decimal(values[0]).mul(values[1]).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return { gross: gross.toNumber(), total: gross.minus(values[2]).toNumber() };
};
export const orderDraftTotals = (lines: OrderDraftLine[], fee: number) => {
  const subtotal = lines.reduce((sum, line) => sum.plus(orderLineTotal(line).gross), new Decimal(0));
  const discount = lines.reduce((sum, line) => sum.plus(Number.isFinite(draftNumber(line.discount)) ? draftNumber(line.discount) : 0), new Decimal(0));
  return { subtotal: subtotal.toNumber(), discountTotal: discount.toNumber(), total: subtotal.minus(discount).plus(Number.isFinite(fee) ? fee : 0).toNumber() };
};

export const orderSubmissionKey = (previous: { fingerprint: string; key: string } | null, payload: unknown, createKey = createIdempotencyKey) => {
  const fingerprint = JSON.stringify(payload);
  return previous?.fingerprint === fingerprint ? previous : { fingerprint, key: createKey() };
};
