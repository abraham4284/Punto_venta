import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type {
  CriticalStockReportFilters,
  CriticalStockReportResponse,
  CreateInitialStockPayload,
  StockResponse,
} from "../types/stock.types";

export const getStockRequest = (): Promise<
  AxiosResponse<ApiResponse<StockResponse[]>>
> => {
  return axios.get("/stock");
};

export const createInitialStockRequest = (
  payload: CreateInitialStockPayload,
): Promise<AxiosResponse<ApiResponse<StockResponse>>> => {
  return axios.post("/stock", payload);
};

export const getCriticalStockReportRequest = (
  filters: CriticalStockReportFilters,
): Promise<AxiosResponse<ApiResponse<CriticalStockReportResponse[]>>> => {
  return axios.get("/stock/report/critical", {
    params: {
      maxQuantity: filters.maxQuantity,
      idDeposit: filters.idDeposit ?? undefined,
      search: filters.search || undefined,
    },
  });
};
