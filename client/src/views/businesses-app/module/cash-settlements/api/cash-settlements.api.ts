import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "../../sales/types";
import type {
  CashSettlementFilters,
  CashSettlementWithPaymentsResponse,
  CreateCashSettlementBody,
  PaginatedCashSettlementsResponse,
  PendingCashSettlementsResponse,
} from "../types";

export const getCashSettlementsRequest = (
  page: number,
  limit: number,
  filters: CashSettlementFilters,
): Promise<AxiosResponse<ApiResponse<PaginatedCashSettlementsResponse>>> => {
  return axios.get("/cash-settlements", {
    params: {
      page,
      limit,
      collectorUserId: filters.collectorUserId ?? undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });
};

export const getCashSettlementByIdRequest = (
  idCashSettlement: number,
): Promise<AxiosResponse<ApiResponse<CashSettlementWithPaymentsResponse>>> => {
  return axios.get(`/cash-settlements/${idCashSettlement}`);
};

export const getPendingCashSettlementsRequest = (
  collectorUserId?: number | null,
): Promise<AxiosResponse<ApiResponse<PendingCashSettlementsResponse>>> => {
  return axios.get("/cash-settlements/pending", {
    params: {
      collectorUserId: collectorUserId ?? undefined,
    },
  });
};

export const createCashSettlementRequest = (
  body: CreateCashSettlementBody,
): Promise<AxiosResponse<ApiResponse<CashSettlementWithPaymentsResponse>>> => {
  return axios.post("/cash-settlements", body);
};
