import type {
  SaleDeliveryFilter,
  SalePaymentAggregateStatus,
  SaleSettlementFilter,
} from "../types/index.js";

export function parsePositiveInteger(value: unknown, defaultValue: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return parsed;
}

export function parseNullablePositiveInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseSaleStatus(value: unknown): "COMPLETED" | "CANCELLED" | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value === "COMPLETED" || value === "CANCELLED") {
    return value;
  }

  throw new Error("El estado de venta seleccionado no es valido");
}

export function parseSalePaymentStatus(
  value: unknown,
): SalePaymentAggregateStatus | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value === "UNPAID" || value === "PARTIALLY_PAID" || value === "PAID") {
    return value;
  }

  throw new Error("El estado de cobro seleccionado no es valido");
}

export function parseSaleDeliveryStatusFilter(
  value: unknown,
): SaleDeliveryFilter | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (
    value === "NO_DELIVERY" ||
    value === "PENDING" ||
    value === "ASSIGNED" ||
    value === "OUT_FOR_DELIVERY" ||
    value === "DELIVERED" ||
    value === "FAILED" ||
    value === "CANCELLED"
  ) {
    return value;
  }

  throw new Error("El estado de entrega seleccionado no es valido");
}

export function parseSaleSettlementStatus(
  value: unknown,
): SaleSettlementFilter | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value === "PENDING_SETTLEMENT" || value === "NO_PENDING_SETTLEMENT") {
    return value;
  }

  throw new Error("El estado de rendicion seleccionado no es valido");
}
