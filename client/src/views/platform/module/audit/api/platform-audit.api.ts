import type { AxiosResponse } from "axios";
import { platformApi } from "@/views/platform/module/auth/api/platformAuth.api";
import type { PlatformApiResponse } from "@/views/platform/module/auth/types";
import type { PaginatedData, PlatformAuditFilters, PlatformAuditLog } from "../types";

type ParamsRecord = Record<string, string | number | null | undefined>;

const buildParams = (params: ParamsRecord) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return searchParams;
};

export const getPlatformAuditLogsRequest = (
  filters: PlatformAuditFilters,
  page: number,
  limit = 15,
): Promise<AxiosResponse<PlatformApiResponse<PaginatedData<PlatformAuditLog>>>> => {
  const params = buildParams({ ...filters, page, limit });
  return platformApi.get(`/platform/audit-logs?${params.toString()}`);
};

export const getPlatformAuditLogByIdRequest = (
  idPlatformAuditLog: number,
): Promise<AxiosResponse<PlatformApiResponse<PlatformAuditLog>>> => {
  return platformApi.get(`/platform/audit-logs/${idPlatformAuditLog}`);
};
