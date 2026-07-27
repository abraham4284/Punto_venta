import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import Decimal from "decimal.js";
import toast from "react-hot-toast";
import {
  assignBusinessSubscriptionRequest,
  cancelBusinessSubscriptionRequest,
  changeBusinessSubscriptionPlanRequest,
  createSubscriptionPaymentRequest,
  createSubscriptionPlanRequest,
  getBusinessSubscriptionsRequest,
  getSubscriptionEventsRequest,
  getSubscriptionPaymentsRequest,
  getSubscriptionPlansRequest,
  processSubscriptionExpirationsRequest,
  reactivateBusinessSubscriptionRequest,
  suspendBusinessSubscriptionRequest,
  updateBusinessSubscriptionAutoRenewRequest,
  updateSubscriptionPaymentStatusRequest,
  updateSubscriptionPlanRequest,
  updateSubscriptionPlanStatusRequest,
} from "../api/subscriptions.api";
import { getSubscriptionErrorMessage } from "../helpers/subscription-format.helpers";
import type {
  AssignSubscriptionBody,
  BusinessSubscription,
  BusinessSubscriptionFilters,
  CreateSubscriptionPaymentBody,
  CreateSubscriptionPlanBody,
  FieldError,
  MutationResult,
  PaginationMeta,
  PlatformApiResponse,
  SubscriptionEvent,
  SubscriptionEventFilters,
  SubscriptionPayment,
  SubscriptionPaymentFilters,
  SubscriptionPaymentFormValues,
  SubscriptionPlan,
  SubscriptionPlanFilters,
  SubscriptionPlanFormValues,
  UpdateSubscriptionPlanBody,
} from "../types/subscriptions.types";

const DEFAULT_PAGINATION: PaginationMeta = {
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 15,
};

const DEFAULT_PLAN_FILTERS: SubscriptionPlanFilters = {
  search: "",
  billingPeriod: "ALL",
  isActive: "ALL",
};

const DEFAULT_SUBSCRIPTION_FILTERS: BusinessSubscriptionFilters = {
  search: "",
  status: "ALL",
  idSubscriptionPlan: "",
  billingPeriod: "ALL",
};

const DEFAULT_PAYMENT_FILTERS: SubscriptionPaymentFilters = {
  idBusinessSubscription: "",
  idBusiness: "",
  status: "ALL",
  paymentMethod: "ALL",
};

const DEFAULT_EVENT_FILTERS: SubscriptionEventFilters = {
  idBusinessSubscription: "",
  idBusiness: "",
  eventType: "ALL",
};

const normalizeNullablePositiveInteger = (
  value: string,
  isUnlimited: boolean,
) => {
  if (isUnlimited || value.trim() === "") return null;
  return new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_FLOOR).toNumber();
};

const normalizeNullableText = (value: string) => {
  const cleanValue = value.trim();
  return cleanValue.length > 0 ? cleanValue : null;
};

const normalizeDateTimeValue = (
  value: string,
  mode: "start" | "end" | "exact" = "exact",
) => {
  const cleanValue = value.trim();

  if (!cleanValue) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return `${cleanValue}T${mode === "end" ? "23:59:59" : "00:00:00"}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(cleanValue)) {
    return `${cleanValue}:00`;
  }

  return cleanValue;
};

const getAxiosMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<PlatformApiResponse<unknown>>;
  return getSubscriptionErrorMessage(
    axiosError.response?.data?.code,
    axiosError.response?.data?.message || axiosError.message || fallback,
  );
};

const getFieldErrors = (error: unknown): FieldError[] => {
  const axiosError = error as AxiosError<PlatformApiResponse<unknown>>;
  return axiosError.response?.data?.errors || [];
};

export const useSubscriptions = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<BusinessSubscription[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);

  const [plansPagination, setPlansPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [subscriptionsPagination, setSubscriptionsPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [paymentsPagination, setPaymentsPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [eventsPagination, setEventsPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);

  const [planFilters, setPlanFilters] =
    useState<SubscriptionPlanFilters>(DEFAULT_PLAN_FILTERS);
  const [subscriptionFilters, setSubscriptionFilters] =
    useState<BusinessSubscriptionFilters>(DEFAULT_SUBSCRIPTION_FILTERS);
  const [paymentFilters, setPaymentFilters] =
    useState<SubscriptionPaymentFilters>(DEFAULT_PAYMENT_FILTERS);
  const [eventFilters, setEventFilters] =
    useState<SubscriptionEventFilters>(DEFAULT_EVENT_FILTERS);

  const [planPage, setPlanPage] = useState(1);
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors([]);
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    setError(null);

    try {
      const { data } = await getSubscriptionPlansRequest(planFilters, planPage);
      setPlans(data.data.records);
      setPlansPagination(data.data.pagination);
    } catch (requestError: unknown) {
      const message = getAxiosMessage(requestError, "No se pudieron cargar los planes");
      setError(message);
      toast.error(message);
    } finally {
      setLoadingPlans(false);
    }
  }, [planFilters, planPage]);

  const fetchSubscriptions = useCallback(async () => {
    setLoadingSubscriptions(true);
    setError(null);

    try {
      const { data } = await getBusinessSubscriptionsRequest(
        subscriptionFilters,
        subscriptionPage,
      );
      setSubscriptions(data.data.records);
      setSubscriptionsPagination(data.data.pagination);
    } catch (requestError: unknown) {
      const message = getAxiosMessage(
        requestError,
        "No se pudieron cargar las suscripciones",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [subscriptionFilters, subscriptionPage]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    setError(null);

    try {
      const { data } = await getSubscriptionPaymentsRequest(paymentFilters, paymentPage);
      setPayments(data.data.records);
      setPaymentsPagination(data.data.pagination);
    } catch (requestError: unknown) {
      const message = getAxiosMessage(requestError, "No se pudieron cargar los pagos");
      setError(message);
      toast.error(message);
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentFilters, paymentPage]);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError(null);

    try {
      const { data } = await getSubscriptionEventsRequest(eventFilters, eventPage);
      setEvents(data.data.records);
      setEventsPagination(data.data.pagination);
    } catch (requestError: unknown) {
      const message = getAxiosMessage(requestError, "No se pudieron cargar los eventos");
      setError(message);
      toast.error(message);
    } finally {
      setLoadingEvents(false);
    }
  }, [eventFilters, eventPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPlans();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPlans]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSubscriptions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSubscriptions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPayments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPayments]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchEvents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchEvents]);

  const applyPlanFilters = (filters: SubscriptionPlanFilters) => {
    setPlanPage(1);
    setPlanFilters(filters);
  };

  const applySubscriptionFilters = (filters: BusinessSubscriptionFilters) => {
    setSubscriptionPage(1);
    setSubscriptionFilters(filters);
  };

  const applyPaymentFilters = (filters: SubscriptionPaymentFilters) => {
    setPaymentPage(1);
    setPaymentFilters(filters);
  };

  const applyEventFilters = (filters: SubscriptionEventFilters) => {
    setEventPage(1);
    setEventFilters(filters);
  };

  const buildPlanBody = (
    values: SubscriptionPlanFormValues,
  ): CreateSubscriptionPlanBody => {
    return {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: normalizeNullableText(values.description),
      billingPeriod: values.billingPeriod,
      price: new Decimal(values.price || 0).toDecimalPlaces(2).toNumber(),
      currency: values.currency.trim().toUpperCase(),
      trialDays: new Decimal(values.trialDays || 0)
        .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
        .toNumber(),
      maxUsers: normalizeNullablePositiveInteger(
        values.maxUsers,
        values.unlimitedUsers,
      ),
      maxProducts: normalizeNullablePositiveInteger(
        values.maxProducts,
        values.unlimitedProducts,
      ),
      maxDeposits: normalizeNullablePositiveInteger(
        values.maxDeposits,
        values.unlimitedDeposits,
      ),
      isActive: values.isActive,
    };
  };

  const createPlan = async (
    values: SubscriptionPlanFormValues,
  ): Promise<MutationResult> => {
    setActionLoading("create-plan");
    setFieldErrors([]);

    try {
      const body = buildPlanBody(values);
      const { data } = await createSubscriptionPlanRequest(body);
      toast.success(data.message || "Plan creado correctamente");
      await fetchPlans();
      return { success: true, message: data.message };
    } catch (requestError: unknown) {
      const message = getAxiosMessage(requestError, "No se pudo crear el plan");
      const errors = getFieldErrors(requestError);
      setFieldErrors(errors);
      toast.error(message);
      return { success: false, message, errors };
    } finally {
      setActionLoading(null);
    }
  };

  const updatePlan = async (
    idSubscriptionPlan: number,
    values: SubscriptionPlanFormValues,
  ): Promise<MutationResult> => {
    setActionLoading(`update-plan-${idSubscriptionPlan}`);
    setFieldErrors([]);

    try {
      const { code, isActive, ...body } = buildPlanBody(values);
      void code;
      void isActive;
      const { data } = await updateSubscriptionPlanRequest(
        idSubscriptionPlan,
        body as UpdateSubscriptionPlanBody,
      );
      toast.success(data.message || "Plan actualizado correctamente");
      await fetchPlans();
      return { success: true, message: data.message };
    } catch (requestError: unknown) {
      const message = getAxiosMessage(requestError, "No se pudo actualizar el plan");
      const errors = getFieldErrors(requestError);
      setFieldErrors(errors);
      toast.error(message);
      return { success: false, message, errors };
    } finally {
      setActionLoading(null);
    }
  };

  const changePlanStatus = async (
    idSubscriptionPlan: number,
    isActive: boolean,
  ) => {
    setActionLoading(`plan-status-${idSubscriptionPlan}`);

    try {
      const { data } = await updateSubscriptionPlanStatusRequest(
        idSubscriptionPlan,
        isActive,
      );
      setPlans((currentPlans) =>
        currentPlans.map((plan) =>
          plan.idSubscriptionPlan === idSubscriptionPlan
            ? { ...plan, isActive }
            : plan,
        ),
      );
      toast.success(data.message || "Estado del plan actualizado");
    } catch (requestError: unknown) {
      toast.error(getAxiosMessage(requestError, "No se pudo cambiar el estado"));
    } finally {
      setActionLoading(null);
    }
  };

  const assignSubscription = async (
    body: AssignSubscriptionBody,
  ): Promise<MutationResult> => {
    setActionLoading("assign-subscription");
    setFieldErrors([]);

    try {
      const { data } = await assignBusinessSubscriptionRequest(body);
      toast.success(data.message || "Suscripcion asignada correctamente");
      await fetchSubscriptions();
      await fetchEvents();
      return { success: true, message: data.message };
    } catch (requestError: unknown) {
      const message = getAxiosMessage(
        requestError,
        "No se pudo asignar la suscripcion",
      );
      const errors = getFieldErrors(requestError);
      setFieldErrors(errors);
      toast.error(message);
      return { success: false, message, errors };
    } finally {
      setActionLoading(null);
    }
  };

  const changeSubscriptionPlan = async (
    idBusinessSubscription: number,
    idSubscriptionPlan: number,
  ) => {
    setActionLoading(`change-subscription-plan-${idBusinessSubscription}`);

    try {
      const { data } = await changeBusinessSubscriptionPlanRequest(
        idBusinessSubscription,
        { idSubscriptionPlan, effectiveMode: "IMMEDIATE" },
      );
      toast.success(data.message || "Plan cambiado correctamente");
      await fetchSubscriptions();
      await fetchEvents();
    } catch (requestError: unknown) {
      toast.error(getAxiosMessage(requestError, "No se pudo cambiar el plan"));
    } finally {
      setActionLoading(null);
    }
  };

  const suspendSubscription = async (
    idBusinessSubscription: number,
    reason: string,
  ): Promise<boolean> => {
    setActionLoading(`suspend-subscription-${idBusinessSubscription}`);

    try {
      const { data } = await suspendBusinessSubscriptionRequest(
        idBusinessSubscription,
        reason,
      );
      toast.success(data.message || "Suscripcion suspendida");
      await fetchSubscriptions();
      await fetchEvents();
      return true;
    } catch (requestError: unknown) {
      toast.error(getAxiosMessage(requestError, "No se pudo suspender"));
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const reactivateSubscription = async (idBusinessSubscription: number) => {
    setActionLoading(`reactivate-subscription-${idBusinessSubscription}`);

    try {
      const { data } = await reactivateBusinessSubscriptionRequest(
        idBusinessSubscription,
      );
      toast.success(data.message || "Suscripcion reactivada");
      await fetchSubscriptions();
      await fetchEvents();
    } catch (requestError: unknown) {
      toast.error(getAxiosMessage(requestError, "No se pudo reactivar"));
    } finally {
      setActionLoading(null);
    }
  };

  const cancelSubscription = async (
    idBusinessSubscription: number,
    reason: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<boolean> => {
    setActionLoading(`cancel-subscription-${idBusinessSubscription}`);
    try {
      const { data } = await cancelBusinessSubscriptionRequest(
        idBusinessSubscription,
        reason,
        cancelAtPeriodEnd,
      );
      console.log(data,'data')
      toast.success(data.message || "Suscripcion cancelada");
      await fetchSubscriptions();
      await fetchEvents();
      return true;
    } catch (requestError: unknown) {
      toast.error(getAxiosMessage(requestError, "No se pudo cancelar"));
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const updateAutoRenew = async (
    idBusinessSubscription: number,
    autoRenew: boolean,
  ) => {
    setActionLoading(`auto-renew-${idBusinessSubscription}`);

    try {
      const { data } = await updateBusinessSubscriptionAutoRenewRequest(
        idBusinessSubscription,
        autoRenew,
      );
      toast.success(data.message || "Renovacion automatica actualizada");
      await fetchSubscriptions();
      await fetchEvents();
    } catch (requestError: unknown) {
      toast.error(
        getAxiosMessage(requestError, "No se pudo actualizar la renovacion"),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const processExpirations = async () => {
    setActionLoading("process-expirations");

    try {
      const { data } = await processSubscriptionExpirationsRequest();
      toast.success(data.message || "Vencimientos procesados");
      await fetchSubscriptions();
      await fetchEvents();
    } catch (requestError: unknown) {
      toast.error(
        getAxiosMessage(requestError, "No se pudieron procesar vencimientos"),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const createPayment = async (
    values: SubscriptionPaymentFormValues,
  ): Promise<MutationResult> => {
    setActionLoading("create-payment");
    setFieldErrors([]);

    try {
      const body: CreateSubscriptionPaymentBody = {
        idBusinessSubscription: Number(values.idBusinessSubscription),
        amount: new Decimal(values.amount || 0).toDecimalPlaces(2).toNumber(),
        currency: values.currency.trim().toUpperCase(),
        paymentMethod: values.paymentMethod,
        status: values.status,
        paidAt: normalizeDateTimeValue(values.paidAt),
        periodStart: normalizeDateTimeValue(values.periodStart, "start") || "",
        periodEnd: normalizeDateTimeValue(values.periodEnd, "end") || "",
        externalReference: normalizeNullableText(values.externalReference),
        providerPaymentId: normalizeNullableText(values.providerPaymentId),
        observation: normalizeNullableText(values.observation),
      };
      const { data } = await createSubscriptionPaymentRequest(body);
      toast.success(data.message || "Pago registrado correctamente");
      await fetchPayments();
      await fetchSubscriptions();
      await fetchEvents();
      return { success: true, message: data.message };
    } catch (requestError: unknown) {
      const message = getAxiosMessage(requestError, "No se pudo registrar el pago");
      const errors = getFieldErrors(requestError);
      setFieldErrors(errors);
      toast.error(message);
      return { success: false, message, errors };
    } finally {
      setActionLoading(null);
    }
  };

  const updatePaymentStatus = async (
    idSubscriptionPayment: number,
    action: "approve" | "reject" | "cancel" | "refund",
  ) => {
    setActionLoading(`payment-${action}-${idSubscriptionPayment}`);
    try {
      console.log(idSubscriptionPayment,'idSubscriptionPayment')
      console.log(action,'action')
      const { data } = await updateSubscriptionPaymentStatusRequest(
        idSubscriptionPayment,
        action,
      );
      console.log(data,'data')
      toast.success(data.message || "Pago actualizado");
      await fetchPayments();
      await fetchSubscriptions();
      await fetchEvents();
    } catch (requestError: unknown) {
      toast.error(getAxiosMessage(requestError, "No se pudo actualizar el pago"));
    } finally {
      setActionLoading(null);
    }
  };

  return {
    plans,
    subscriptions,
    payments,
    events,
    plansPagination,
    subscriptionsPagination,
    paymentsPagination,
    eventsPagination,
    planFilters,
    subscriptionFilters,
    paymentFilters,
    eventFilters,
    planPage,
    subscriptionPage,
    paymentPage,
    eventPage,
    loadingPlans,
    loadingSubscriptions,
    loadingPayments,
    loadingEvents,
    actionLoading,
    fieldErrors,
    error,
    clearFieldErrors,
    applyPlanFilters,
    applySubscriptionFilters,
    applyPaymentFilters,
    applyEventFilters,
    setPlanPage,
    setSubscriptionPage,
    setPaymentPage,
    setEventPage,
    createPlan,
    updatePlan,
    changePlanStatus,
    assignSubscription,
    changeSubscriptionPlan,
    suspendSubscription,
    reactivateSubscription,
    cancelSubscription,
    updateAutoRenew,
    processExpirations,
    createPayment,
    updatePaymentStatus,
  };
};

export type UseSubscriptionsReturn = ReturnType<typeof useSubscriptions>;
