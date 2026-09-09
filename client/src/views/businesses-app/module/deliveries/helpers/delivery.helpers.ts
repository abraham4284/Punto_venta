import type { DeliveryEventType, DeliveryResponse, DeliveryStatus, JsonValue } from "../types";

export type DeliveryAction =
  | "VIEW"
  | "ASSIGN"
  | "START"
  | "DELIVER"
  | "FAIL"
  | "RESCHEDULE"
  | "CANCEL";

export type DeliveryPermissions = {
  canAssign: boolean;
  canUpdateStatus: boolean;
  canViewAll: boolean;
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregada",
  FAILED: "Fallida",
  CANCELLED: "Cancelada",
};

export const deliveryEventLabels: Record<DeliveryEventType, string> = {
  DELIVERY_CREATED: "Entrega creada",
  DELIVERY_ASSIGNED: "Cadete asignado",
  DELIVERY_UNASSIGNED: "Asignación removida",
  DELIVERY_OUT_FOR_DELIVERY: "Entrega iniciada",
  DELIVERY_FAILED: "Entrega fallida",
  DELIVERY_RESCHEDULED: "Entrega reagendada",
  DELIVERY_DELIVERED: "Entrega entregada",
  DELIVERY_CANCELLED: "Entrega cancelada",
};

export const deliveryStatusClassNames: Record<DeliveryStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
  OUT_FOR_DELIVERY: "border-violet-200 bg-violet-50 text-violet-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

export const finalDeliveryStatuses: DeliveryStatus[] = ["DELIVERED", "CANCELLED"];

export const formatDeliveryMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDeliveryDate = (value: string | null): string => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const isFinalDeliveryStatus = (status: DeliveryStatus): boolean => {
  return finalDeliveryStatuses.includes(status);
};

export const getDeliveryStatusLabel = (
  status: DeliveryStatus | null,
): string => {
  if (!status) return "Sin estado";
  return deliveryStatusLabels[status] ?? status;
};

export const getDeliveryEventLabel = (
  eventType: DeliveryEventType | string,
): string => {
  return deliveryEventLabels[eventType as DeliveryEventType] ?? "Evento de entrega";
};

export const getDeliveryMetadataLines = (metadata: JsonValue | null): string[] => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const lines: string[] = [];

  if ("assignedToUserId" in metadata) {
    lines.push(`Cadete asignado #${String(metadata.assignedToUserId)}`);
  }

  if ("scheduledAt" in metadata && metadata.scheduledAt) {
    lines.push(`Programada: ${formatDeliveryDate(String(metadata.scheduledAt))}`);
  }

  if ("failureReason" in metadata && metadata.failureReason) {
    lines.push(`Motivo: ${String(metadata.failureReason)}`);
  }

  if ("observation" in metadata && metadata.observation) {
    lines.push(`Obs: ${String(metadata.observation)}`);
  }

  return lines;
};

export const getAllowedDeliveryActions = (
  delivery: DeliveryResponse,
  permissions: DeliveryPermissions,
): DeliveryAction[] => {
  const actions: DeliveryAction[] = ["VIEW"];

  if (delivery.status === "PENDING") {
    if (permissions.canAssign) actions.push("ASSIGN");
    if (permissions.canUpdateStatus) actions.push("CANCEL");
    return actions;
  }

  if (delivery.status === "ASSIGNED") {
    if (permissions.canUpdateStatus) actions.push("START", "CANCEL");
    if (permissions.canAssign) actions.push("ASSIGN");
    return actions;
  }

  if (delivery.status === "OUT_FOR_DELIVERY") {
    if (permissions.canUpdateStatus) actions.push("DELIVER", "FAIL");
    return actions;
  }

  if (delivery.status === "FAILED") {
    if (permissions.canUpdateStatus) actions.push("RESCHEDULE", "CANCEL");
    return actions;
  }

  return actions;
};

export const getDeliveryErrorMessage = (
  message: string | undefined,
  fallback: string,
): string => {
  const messages: Record<string, string> = {
    DELIVERY_PENDING_CASH_PAYMENT_MUST_BE_COLLECTED:
      "Registrá primero el efectivo recibido antes de confirmar la entrega.",
    DELIVERY_CASH_PAYMENT_REQUIRES_COLLECTION:
      "Este efectivo debe registrarlo el cadete y luego rendirse en caja.",
  };

  if (!message) return fallback;

  return messages[message] ?? message;
};
