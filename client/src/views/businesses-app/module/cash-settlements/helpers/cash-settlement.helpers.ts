import { Decimal } from "decimal.js";
import type {
  CashSettlementPaymentResponse,
  PendingCashSettlementPaymentResponse,
} from "../types";

export const formatSettlementMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

export const formatSettlementDate = (value: string | null): string => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const calculateSelectedSettlementTotal = (
  payments: PendingCashSettlementPaymentResponse[],
  selectedIds: Set<number>,
): number => {
  const total = payments.reduce((accumulator, payment) => {
    if (!selectedIds.has(payment.idSalePayment)) return accumulator;
    return accumulator.plus(payment.amount);
  }, new Decimal(0));

  return Number(total.toFixed(2));
};

export const calculateSettlementPaymentsTotal = (
  payments: CashSettlementPaymentResponse[],
): number => {
  const total = payments.reduce((accumulator, payment) => {
    return accumulator.plus(payment.amount);
  }, new Decimal(0));

  return Number(total.toFixed(2));
};

export const getCashSettlementErrorMessage = (
  message: string | undefined,
  fallback: string,
): string => {
  const messages: Record<string, string> = {
    CASH_SESSION_CLOSED:
      "La caja receptora se cerró antes de registrar la rendición.",
    CASH_SESSION_NOT_FOUND:
      "No se encontró una caja abierta para recibir la rendición.",
    CASH_SETTLEMENT_PAYMENT_NOT_ELIGIBLE:
      "Uno o más pagos ya no están disponibles para rendir.",
    CASH_SETTLEMENT_PAYMENT_ALREADY_SETTLED:
      "Uno o más pagos seleccionados ya fueron rendidos.",
    CASH_SETTLEMENT_MIXED_COLLECTOR:
      "Los pagos seleccionados no pertenecen al mismo cadete.",
    COLLECTOR_USER_NOT_FOUND:
      "No se encontró el cadete seleccionado o no está habilitado.",
    RECEIVER_USER_NOT_FOUND:
      "Tu usuario no tiene rol válido para recibir rendiciones.",
  };

  if (!message) return fallback;

  return messages[message] ?? message;
};
