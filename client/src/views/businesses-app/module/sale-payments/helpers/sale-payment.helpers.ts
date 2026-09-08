import { Decimal } from "decimal.js";
import type { PaymentMethodResponse } from "../../payment-methods/types";
import type { SalePaymentResponse, SalePaymentStatus } from "../types";

export type SalePaymentContext = "sale-detail" | "delivery-detail";

export type SalePaymentPermissions = {
  canCreate: boolean;
  canUpdate: boolean;
  canCancel: boolean;
  canCollect: boolean;
  canConfirm: boolean;
};

export const salePaymentStatusLabels: Record<SalePaymentStatus, string> = {
  PENDING: "Pendiente",
  COLLECTED: "Cobrado por cadete",
  CONFIRMED: "Confirmado",
  CANCELLED: "Anulado",
};

export const salePaymentStatusDescriptions: Record<SalePaymentStatus, string> = {
  PENDING: "Importe pendiente de cobro o confirmación.",
  COLLECTED: "Pendiente de rendición.",
  CONFIRMED: "Reconocido por el negocio.",
  CANCELLED: "Pago anulado, se conserva para auditoría.",
};

export const salePaymentStatusClassNames: Record<SalePaymentStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  COLLECTED: "border-violet-200 bg-violet-50 text-violet-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

export const formatPaymentMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatPaymentDate = (value: string | null): string => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getActivePaymentsTotal = (
  payments: SalePaymentResponse[],
  excludedPaymentId?: number,
): Decimal => {
  return payments.reduce((total, payment) => {
    if (payment.idSalePayment === excludedPaymentId) return total;
    if (payment.status === "CANCELLED") return total;

    return total.plus(payment.amount);
  }, new Decimal(0));
};

export const getRemainingBalance = (
  saleTotal: number,
  payments: SalePaymentResponse[],
  excludedPaymentId?: number,
): number => {
  const remaining = new Decimal(saleTotal).minus(
    getActivePaymentsTotal(payments, excludedPaymentId),
  );

  return Number(Decimal.max(remaining, new Decimal(0)).toDecimalPlaces(2));
};

export const isOverPayment = (
  amount: number,
  saleTotal: number,
  payments: SalePaymentResponse[],
  excludedPaymentId?: number,
): boolean => {
  const nextTotal = getActivePaymentsTotal(payments, excludedPaymentId).plus(amount);

  return nextTotal.greaterThan(new Decimal(saleTotal));
};

export const getCashPaymentMethods = (
  paymentMethods: PaymentMethodResponse[],
): PaymentMethodResponse[] => {
  return paymentMethods.filter((paymentMethod) => {
    return paymentMethod.isActive && (paymentMethod.affectsCash || paymentMethod.code === "CASH");
  });
};

export const getPaymentMethodLabel = (
  paymentMethod: PaymentMethodResponse | undefined,
): string => {
  if (!paymentMethod) return "Seleccioná un método";

  return paymentMethod.affectsCash
    ? `${paymentMethod.name} · Efectivo`
    : paymentMethod.name;
};
