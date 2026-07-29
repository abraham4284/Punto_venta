import type { AxiosResponse } from "axios";
import { platformApi } from "@/views/platform/module/auth/api/platformAuth.api";
import type { PlatformApiResponse } from "@/views/platform/module/auth/types";
import type {
  PaginatedData,
  PlatformBusinessActivity,
  PlatformBusinessDetail,
  PlatformBusinessFilters,
  PlatformBusinessListItem,
  PlatformBusinessPurchase,
  PlatformBusinessSale,
  PlatformBusinessUsage,
  PlatformBusinessUser,
} from "../types";

type ParamsRecord = Record<string, string | number | boolean | null | undefined>;

const buildParams = (params: ParamsRecord) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "ALL") return;
    searchParams.set(key, String(value));
  });

  return searchParams;
};

export const getPlatformBusinessesRequest = (
  filters: PlatformBusinessFilters,
  page: number,
  limit = 15,
): Promise<AxiosResponse<PlatformApiResponse<PaginatedData<PlatformBusinessListItem>>>> => {
  const params = buildParams({
    ...filters,
    page,
    limit,
  });

  return platformApi.get(`/platform/businesses?${params.toString()}`);
};

export const getPlatformBusinessByIdRequest = (
  idBusiness: number,
): Promise<AxiosResponse<PlatformApiResponse<PlatformBusinessDetail>>> => {
  return platformApi.get(`/platform/businesses/${idBusiness}`);
};

export const getPlatformBusinessUsersRequest = (
  idBusiness: number,
): Promise<AxiosResponse<PlatformApiResponse<PlatformBusinessUser[]>>> => {
  return platformApi.get(`/platform/businesses/${idBusiness}/users`);
};

export const getPlatformBusinessActivityRequest = (
  idBusiness: number,
): Promise<AxiosResponse<PlatformApiResponse<PlatformBusinessActivity>>> => {
  return platformApi.get(`/platform/businesses/${idBusiness}/activity`);
};

export const getPlatformBusinessUsageRequest = (
  idBusiness: number,
): Promise<AxiosResponse<PlatformApiResponse<PlatformBusinessUsage>>> => {
  return platformApi.get(`/platform/businesses/${idBusiness}/usage`);
};

export const getPlatformBusinessRecentSalesRequest = (
  idBusiness: number,
): Promise<AxiosResponse<PlatformApiResponse<PlatformBusinessSale[]>>> => {
  return platformApi.get(`/platform/businesses/${idBusiness}/recent-sales`);
};

export const getPlatformBusinessRecentPurchasesRequest = (
  idBusiness: number,
): Promise<AxiosResponse<PlatformApiResponse<PlatformBusinessPurchase[]>>> => {
  return platformApi.get(`/platform/businesses/${idBusiness}/recent-purchases`);
};

export const changePlatformBusinessStatusRequest = (
  idBusiness: number,
  isActive: boolean,
  reason: string,
): Promise<AxiosResponse<PlatformApiResponse<PlatformBusinessListItem>>> => {
  return platformApi.patch(`/platform/businesses/${idBusiness}/status`, {
    isActive,
    reason,
  });
};
