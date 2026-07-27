import type {
  CurrentBusinessSubscriptionResponse,
  CurrentBusinessSubscriptionRow,
} from "../types/index.js";

type SubscriptionNotification =
  CurrentBusinessSubscriptionResponse["notification"];

function isEndingSoon(daysRemaining: number | null): boolean {
  return daysRemaining !== null && daysRemaining <= 7;
}

export function buildBusinessSubscriptionNotification(
  row?: CurrentBusinessSubscriptionRow,
): SubscriptionNotification {
  if (!row?.idBusinessSubscription || !row.status) {
    return {
      severity: "BLOCKED",
      code: "NO_SUBSCRIPTION",
      title: "Suscripcion no encontrada",
      message:
        "El negocio no tiene una suscripcion comercial vigente. Contacta al administrador de la plataforma para habilitar el acceso.",
      reason: null,
      shouldShowBanner: true,
      shouldBlockApplication: true,
    };
  }

  if (row.businessStatus !== "ACTIVE") {
    return {
      severity: "BLOCKED",
      code: "BUSINESS_INACTIVE",
      title: "Negocio no habilitado",
      message:
        "El comercio no se encuentra activo en la plataforma. Las operaciones quedan bloqueadas hasta su regularizacion.",
      reason: row.suspensionReason ?? row.cancellationReason,
      shouldShowBanner: true,
      shouldBlockApplication: true,
    };
  }

  if (row.status === "SUSPENDED") {
    return {
      severity: "BLOCKED",
      code: "SUSPENDED",
      title: "Suscripcion suspendida",
      message:
        "La suscripcion fue suspendida administrativamente. Regulariza la situacion para recuperar el acceso operativo.",
      reason: row.suspensionReason,
      shouldShowBanner: true,
      shouldBlockApplication: true,
    };
  }

  if (row.status === "CANCELLED") {
    return {
      severity: "BLOCKED",
      code: "CANCELLED",
      title: "Suscripcion cancelada",
      message:
        "La suscripcion fue cancelada. El negocio conserva sus datos, pero no puede realizar operaciones.",
      reason: row.cancellationReason,
      shouldShowBanner: true,
      shouldBlockApplication: true,
    };
  }

  if (row.status === "EXPIRED") {
    return {
      severity: "BLOCKED",
      code: "EXPIRED",
      title: "Suscripcion expirada",
      message:
        "La suscripcion expiro y el periodo operativo finalizo. Es necesario renovar para continuar trabajando.",
      reason: null,
      shouldShowBanner: true,
      shouldBlockApplication: true,
    };
  }

  if (row.cancelAtPeriodEnd) {
    return {
      severity: "WARNING",
      code: "CANCELLATION_SCHEDULED",
      title: "Cancelacion programada",
      message:
        "La suscripcion seguira activa hasta el fin del periodo actual y luego se cancelara automaticamente.",
      reason: row.cancellationReason,
      shouldShowBanner: true,
      shouldBlockApplication: false,
    };
  }

  if (row.status === "PAST_DUE") {
    return {
      severity: "CRITICAL",
      code: "PAST_DUE",
      title: "Pago vencido",
      message:
        "La suscripcion esta vencida y se encuentra en periodo de gracia. Regulariza el pago para evitar el bloqueo operativo.",
      reason: null,
      shouldShowBanner: true,
      shouldBlockApplication: false,
    };
  }

  if (row.status === "TRIAL") {
    const endingSoon = isEndingSoon(row.daysRemaining);
    return {
      severity: endingSoon ? "WARNING" : "INFO",
      code: endingSoon ? "TRIAL_ENDING" : "TRIAL_ACTIVE",
      title: endingSoon ? "La prueba esta por finalizar" : "Periodo de prueba activo",
      message: endingSoon
        ? "Quedan pocos dias de prueba. Registra un pago para mantener el acceso sin interrupciones."
        : "El negocio esta usando el periodo de prueba gratuito.",
      reason: null,
      shouldShowBanner: true,
      shouldBlockApplication: false,
    };
  }

  if (row.status === "ACTIVE" && isEndingSoon(row.daysRemaining)) {
    return {
      severity: "WARNING",
      code: "ACTIVE_ENDING",
      title: "Periodo proximo a vencer",
      message:
        "La suscripcion esta activa, pero el periodo comercial finaliza pronto. Revisa la renovacion.",
      reason: null,
      shouldShowBanner: true,
      shouldBlockApplication: false,
    };
  }

  return {
    severity: "INFO",
    code: "ACTIVE_OK",
    title: "Suscripcion activa",
    message: "El negocio se encuentra habilitado para operar.",
    reason: null,
    shouldShowBanner: false,
    shouldBlockApplication: false,
  };
}
