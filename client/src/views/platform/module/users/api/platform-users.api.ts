import type { AxiosResponse } from "axios";
import { platformApi } from "@/views/platform/module/auth/api/platformAuth.api";
import type { PlatformApiResponse, PlatformRole } from "@/views/platform/module/auth/types";
import type {
  CreatePlatformUserBody,
  PaginatedData,
  PlatformUserAdmin,
  PlatformUserFilters,
} from "../types";

const buildParams = (
  filters: PlatformUserFilters,
  page: number,
  limit = 15,
) => {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.role !== "ALL") params.set("role", filters.role);
  if (filters.isActive !== "ALL") {
    params.set("isActive", String(filters.isActive === "ACTIVE"));
  }
  params.set("page", String(page));
  params.set("limit", String(limit));

  return params;
};

export const getPlatformUsersRequest = (
  filters: PlatformUserFilters,
  page: number,
): Promise<AxiosResponse<PlatformApiResponse<PaginatedData<PlatformUserAdmin>>>> => {
  const params = buildParams(filters, page);
  return platformApi.get(`/platform/users?${params.toString()}`);
};

export const createPlatformUserRequest = (
  body: CreatePlatformUserBody,
): Promise<AxiosResponse<PlatformApiResponse<PlatformUserAdmin>>> => {
  return platformApi.post("/platform/users", body);
};

export const changePlatformUserRoleRequest = (
  idPlatformUser: number,
  platformRole: PlatformRole,
): Promise<AxiosResponse<PlatformApiResponse<PlatformUserAdmin>>> => {
  return platformApi.patch(`/platform/users/${idPlatformUser}/role`, {
    platformRole,
  });
};

export const changePlatformUserStatusRequest = (
  idPlatformUser: number,
  isActive: boolean,
  reason: string,
): Promise<AxiosResponse<PlatformApiResponse<PlatformUserAdmin>>> => {
  return platformApi.patch(`/platform/users/${idPlatformUser}/status`, {
    isActive,
    reason,
  });
};

export const revokePlatformUserSessionsRequest = (
  idPlatformUser: number,
  reason: string,
): Promise<AxiosResponse<PlatformApiResponse<{ revokedSessions: number }>>> => {
  return platformApi.post(`/platform/users/${idPlatformUser}/revoke-sessions`, {
    reason,
  });
};
