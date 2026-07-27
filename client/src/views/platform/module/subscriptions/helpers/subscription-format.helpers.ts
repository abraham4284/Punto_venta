import Decimal from "decimal.js";
import type {
  BillingPeriod,
  SubscriptionEventType,
  SubscriptionPaymentMethod,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from "../types/subscriptions.types";

export const formatMoney = (amount: string | number, currency = "ARS") => {
  const value = new Decimal(amount || 0).toNumber();

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getBillingPeriodLabel = (period: BillingPeriod) => {
  return period === "MONTHLY" ? "Mensual" : "Anual";
};

export const getLimitLabel = (value: number | null) => {
  return value === null ? "Ilimitado" : String(value);
};

export const getTrialLabel = (days: number) => {
  return days > 0 ? `${days} dias` : "Sin prueba";
};

export const getSubscriptionStatusLabel = (status: SubscriptionStatus) => {
  const labels: Record<SubscriptionStatus, string> = {
    TRIAL: "Prueba",
    ACTIVE: "Activa",
    PAST_DUE: "Vencida",
    SUSPENDED: "Suspendida",
    CANCELLED: "Cancelada",
    EXPIRED: "Expirada",
  };

  return labels[status];
};

export const getPaymentStatusLabel = (status: SubscriptionPaymentStatus) => {
  const labels: Record<SubscriptionPaymentStatus, string> = {
    PENDING: "Pendiente",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  };

  return labels[status];
};

export const getPaymentMethodLabel = (method: SubscriptionPaymentMethod) => {
  const labels: Record<SubscriptionPaymentMethod, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    MERCADO_PAGO: "Mercado Pago",
    CARD: "Tarjeta",
    OTHER: "Otro",
  };

  return labels[method];
};

export const getSubscriptionEventLabel = (event: SubscriptionEventType) => {
  const labels: Record<SubscriptionEventType, string> = {
    TRIAL_STARTED: "Prueba iniciada",
    TRIAL_EXPIRED: "Prueba vencida",
    PAYMENT_CREATED: "Pago creado",
    PAYMENT_PENDING: "Pago pendiente",
    PAYMENT_APPROVED: "Pago aprobado",
    PAYMENT_REJECTED: "Pago rechazado",
    PAYMENT_CANCELLED: "Pago cancelado",
    PAYMENT_REFUNDED: "Pago reembolsado",
    SUBSCRIPTION_ACTIVATED: "Suscripcion activada",
    SUBSCRIPTION_RENEWED: "Suscripcion renovada",
    SUBSCRIPTION_PAST_DUE: "Suscripcion vencida",
    SUBSCRIPTION_SUSPENDED: "Suscripcion suspendida",
    SUBSCRIPTION_REACTIVATED: "Suscripcion reactivada",
    SUBSCRIPTION_CANCELLED: "Suscripcion cancelada",
    SUBSCRIPTION_EXPIRED: "Suscripcion expirada",
    PLAN_CHANGED: "Plan modificado",
    AUTO_RENEW_ENABLED: "Renovacion automatica activada",
    AUTO_RENEW_DISABLED: "Renovacion automatica desactivada",
  };

  return labels[event];
};

export const getSubscriptionErrorMessage = (code?: string, fallback?: string) => {
  const messages: Record<string, string> = {
    SUBSCRIPTION_PLAN_NOT_FOUND: "El plan solicitado no existe.",
    SUBSCRIPTION_NOT_FOUND: "La suscripcion solicitada no existe.",
    SUBSCRIPTION_ALREADY_EXISTS: "El negocio ya tiene una suscripcion vigente.",
    TRIAL_ALREADY_USED: "Este negocio ya utilizo su periodo de prueba.",
    PAYMENT_ALREADY_PROCESSED: "Este pago ya fue procesado.",
    INVALID_SUBSCRIPTION_TRANSITION: "La transicion solicitada no es valida.",
    SUBSCRIPTION_REQUIRED: "La suscripcion del negocio no esta habilitada.",
    PLAN_LIMIT_REACHED: "El plan actual alcanzo el limite permitido.",
  };

  return code ? messages[code] || fallback || "No se pudo completar la accion" : fallback || "No se pudo completar la accion";
};
