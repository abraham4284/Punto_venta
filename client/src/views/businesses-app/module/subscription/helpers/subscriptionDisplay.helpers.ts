import Decimal from "decimal.js";
import type {
  BillingPeriod,
  SubscriptionNotificationSeverity,
  SubscriptionStatus,
} from "../types/businessSubscription.types";

export const formatSubscriptionDate = (value?: string | null): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatSubscriptionMoney = (
  amount?: string | number | null,
  currency = "ARS",
): string => {
  const value = new Decimal(amount ?? 0).toDecimalPlaces(2).toNumber();

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export const getSubscriptionStatusLabel = (
  status?: SubscriptionStatus | null,
): string => {
  const labels: Record<SubscriptionStatus, string> = {
    TRIAL: "Prueba",
    ACTIVE: "Activa",
    PAST_DUE: "Vencida",
    SUSPENDED: "Suspendida",
    CANCELLED: "Cancelada",
    EXPIRED: "Expirada",
  };

  return status ? labels[status] : "Sin suscripcion";
};

export const getBillingPeriodLabel = (period?: BillingPeriod | null): string => {
  if (!period) return "-";
  return period === "MONTHLY" ? "Mensual" : "Anual";
};

export const getNotificationClasses = (
  severity?: SubscriptionNotificationSeverity,
): string => {
  if (severity === "BLOCKED") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (severity === "CRITICAL") {
    return "border-amber-300 bg-amber-50 text-amber-950";
  }

  if (severity === "WARNING") {
    return "border-yellow-200 bg-yellow-50 text-yellow-950";
  }

  return "border-sky-200 bg-sky-50 text-sky-950";
};

export const getSupportContactUrl = (): string => {
  const whatsapp = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;
  const email = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined;

  if (whatsapp) {
    return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
  }

  if (email) {
    return `mailto:${email}`;
  }

  return "mailto:soporte@punto-venta.local";
};
