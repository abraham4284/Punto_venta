import { Decimal } from "decimal.js";
import type { OrderBody, OrderStatus, UnitType } from "../types/index.js";

export class OrderError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export function assertOrderEditable(status: OrderStatus): void {
  if (status !== "PENDING" && status !== "CONFIRMED") {
    throw new OrderError(409, "ORDER_NOT_EDITABLE", "El pedido ya no admite edicion");
  }
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDING: "CONFIRMED", CONFIRMED: "PREPARING", PREPARING: "READY",
  };
  if (transitions[from] !== to) {
    throw new OrderError(409, "ORDER_INVALID_TRANSITION", "Transicion de pedido no permitida");
  }
}

export function assertOrderCancellable(status: OrderStatus): void {
  if (status === "CANCELLED" || status === "COMPLETED") {
    throw new OrderError(409, "ORDER_TERMINAL", "El pedido se encuentra en un estado terminal");
  }
}

export function assertOrderQuantity(unit: UnitType, quantity: number): void {
  if (unit === "UNIT" && !Number.isInteger(quantity)) {
    throw new OrderError(400, "ORDER_UNIT_QUANTITY", "Los productos por unidad requieren cantidades enteras");
  }
}

export function calculateOrderTotals(items: OrderBody["items"], deliveryFee: number) {
  let subtotal = new Decimal(0);
  let discountTotal = new Decimal(0);
  const lineTotals = items.map(function calculateLine(item) {
    const gross = new Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    subtotal = subtotal.plus(gross);
    discountTotal = discountTotal.plus(item.discount);
    return gross.minus(item.discount).toNumber();
  });
  return {
    subtotal: subtotal.toNumber(), discountTotal: discountTotal.toNumber(),
    total: subtotal.minus(discountTotal).plus(deliveryFee).toNumber(), lineTotals,
  };
}
