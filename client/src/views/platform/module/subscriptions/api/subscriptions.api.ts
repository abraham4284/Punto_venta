import type { AxiosResponse } from "axios";
import { platformApi } from "@/views/platform/module/auth/api/platformAuth.api";
import type {
  AssignSubscriptionBody,
  BusinessOption,
  BusinessSubscription,
  BusinessSubscriptionFilters,
  ChangeSubscriptionPlanBody,
  CreateSubscriptionPaymentBody,
  CreateSubscriptionPlanBody,
  PaginatedData,
  PlatformApiResponse,
  SubscriptionEvent,
  SubscriptionEventFilters,
  SubscriptionPayment,
  SubscriptionPaymentFilters,
  SubscriptionPlan,
  SubscriptionPlanFilters,
  UpdateSubscriptionPlanBody,
} from "../types/subscriptions.types";

type ParamsRecord = Record<string, string | number | boolean | null | undefined>;

const buildParams = (params: ParamsRecord) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "ALL") return;
    searchParams.set(key, String(value));
  });

  return searchParams;
};

export const getSubscriptionPlansRequest = (
  filters: SubscriptionPlanFilters,
  page: number,
  limit = 15,
): Promise<AxiosResponse<PlatformApiResponse<PaginatedData<SubscriptionPlan>>>> => {
  const params = buildParams({
    search: filters.search,
    billingPeriod: filters.billingPeriod,
    isActive:
      filters.isActive === "ACTIVE"
        ? true
        : filters.isActive === "INACTIVE"
          ? false
          : undefined,
    page,
    limit,
  });

  return platformApi.get(`/platform/subscription-plans?${params.toString()}`);
};

export const createSubscriptionPlanRequest = (
  body: CreateSubscriptionPlanBody,
): Promise<AxiosResponse<PlatformApiResponse<SubscriptionPlan>>> => {
  return platformApi.post("/platform/subscription-plans", body);
};

export const updateSubscriptionPlanRequest = (
  idSubscriptionPlan: number,
  body: UpdateSubscriptionPlanBody,
): Promise<AxiosResponse<PlatformApiResponse<SubscriptionPlan>>> => {
  return platformApi.patch(`/platform/subscription-plans/${idSubscriptionPlan}`, body);
};

export const updateSubscriptionPlanStatusRequest = (
  idSubscriptionPlan: number,
  isActive: boolean,
): Promise<AxiosResponse<PlatformApiResponse<SubscriptionPlan>>> => {
  return platformApi.patch(`/platform/subscription-plans/${idSubscriptionPlan}/status`, {
    isActive,
  });
};

export const getBusinessSubscriptionsRequest = (
  filters: BusinessSubscriptionFilters,
  page: number,
  limit = 15,
): Promise<AxiosResponse<PlatformApiResponse<PaginatedData<BusinessSubscription>>>> => {
  const params = buildParams({
    search: filters.search,
    status: filters.status,
    idSubscriptionPlan: filters.idSubscriptionPlan,
    billingPeriod: filters.billingPeriod,
    page,
    limit,
  });

  return platformApi.get(`/platform/business-subscriptions?${params.toString()}`);
};

export const getBusinessOptionsRequest = (): Promise<
  AxiosResponse<PlatformApiResponse<BusinessOption[]>>
> => {
  return platformApi.get("/platform/business-options");
};

export const assignBusinessSubscriptionRequest = (
  body: AssignSubscriptionBody,
): Promise<AxiosResponse<PlatformApiResponse<BusinessSubscription>>> => {
  return platformApi.post("/platform/business-subscriptions", body);
};

export const changeBusinessSubscriptionPlanRequest = (
  idBusinessSubscription: number,
  body: ChangeSubscriptionPlanBody,
): Promise<AxiosResponse<PlatformApiResponse<BusinessSubscription>>> => {
  return platformApi.patch(
    `/platform/business-subscriptions/${idBusinessSubscription}/plan`,
    body,
  );
};

export const suspendBusinessSubscriptionRequest = (
  idBusinessSubscription: number,
  reason: string,
): Promise<AxiosResponse<PlatformApiResponse<BusinessSubscription>>> => {
  return platformApi.patch(
    `/platform/business-subscriptions/${idBusinessSubscription}/suspend`,
    { reason },
  );
};

export const reactivateBusinessSubscriptionRequest = (
  idBusinessSubscription: number,
): Promise<AxiosResponse<PlatformApiResponse<BusinessSubscription>>> => {
  return platformApi.patch(
    `/platform/business-subscriptions/${idBusinessSubscription}/reactivate`,
  );
};

export const cancelBusinessSubscriptionRequest = (
  idBusinessSubscription: number,
  reason: string,
  cancelAtPeriodEnd: boolean,
): Promise<AxiosResponse<PlatformApiResponse<BusinessSubscription>>> => {
  return platformApi.patch(
    `/platform/business-subscriptions/${idBusinessSubscription}/cancel`,
    { reason, cancelAtPeriodEnd },
  );
};

export const updateBusinessSubscriptionAutoRenewRequest = (
  idBusinessSubscription: number,
  autoRenew: boolean,
): Promise<AxiosResponse<PlatformApiResponse<BusinessSubscription>>> => {
  return platformApi.patch(
    `/platform/business-subscriptions/${idBusinessSubscription}/auto-renew`,
    { autoRenew },
  );
};

export const processSubscriptionExpirationsRequest = (): Promise<
  AxiosResponse<PlatformApiResponse<Record<string, number>>>
> => {
  return platformApi.post("/platform/subscriptions/process-expirations");
};

export const getSubscriptionPaymentsRequest = (
  filters: SubscriptionPaymentFilters,
  page: number,
  limit = 15,
): Promise<AxiosResponse<PlatformApiResponse<PaginatedData<SubscriptionPayment>>>> => {
  const params = buildParams({
    idBusinessSubscription: filters.idBusinessSubscription,
    idBusiness: filters.idBusiness,
    status: filters.status,
    paymentMethod: filters.paymentMethod,
    page,
    limit,
  });

  return platformApi.get(`/platform/subscription-payments?${params.toString()}`);
};

export const createSubscriptionPaymentRequest = (
  body: CreateSubscriptionPaymentBody,
): Promise<AxiosResponse<PlatformApiResponse<SubscriptionPayment>>> => {
  return platformApi.post("/platform/subscription-payments", body);
};

export const updateSubscriptionPaymentStatusRequest = (
  idSubscriptionPayment: number,
  action: "approve" | "reject" | "cancel" | "refund",
  observation?: string,
): Promise<AxiosResponse<PlatformApiResponse<SubscriptionPayment>>> => {
  return platformApi.patch(`/platform/subscription-payments/${idSubscriptionPayment}/${action}`, {
    observation: observation || null,
  });
};

export const getSubscriptionEventsRequest = (
  filters: SubscriptionEventFilters,
  page: number,
  limit = 15,
): Promise<AxiosResponse<PlatformApiResponse<PaginatedData<SubscriptionEvent>>>> => {
  const params = buildParams({
    idBusinessSubscription: filters.idBusinessSubscription,
    idBusiness: filters.idBusiness,
    eventType: filters.eventType,
    page,
    limit,
  });

  return platformApi.get(`/platform/subscription-events?${params.toString()}`);
};
