import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type {
  AdvancedStockFilters,
  AdvancedStockResponse,
  CriticalStockReportFilters,
  CriticalStockReportResponse,
  CreateInitialStockPayload,
  StockBalanceResponse,
  StockProductSearchQuery,
  StockProductSearchResponse,
  StockResponse,
} from "../types/stock.types";

const appendParam = (
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
) => {
  if (value === null || value === undefined || value === "") return;
  params.append(key, String(value));
};

export const getStockRequest = (): Promise<
  AxiosResponse<ApiResponse<StockResponse[]>>
> => {
  return axios.get("/stock");
};

export const getAdvancedStockInventoryRequest = (
  filters: AdvancedStockFilters,
): Promise<AxiosResponse<ApiResponse<AdvancedStockResponse>>> => {
  const params = new URLSearchParams();

  appendParam(params, "search", filters.search.trim());
  appendParam(params, "idDeposit", filters.idDeposit);
  appendParam(params, "quantity", filters.quantity);
  appendParam(params, "minQuantity", filters.minQuantity);
  appendParam(params, "maxQuantity", filters.maxQuantity);
  appendParam(params, "alertStatus", filters.alertStatus);
  appendParam(params, "page", filters.page);
  appendParam(params, "limit", filters.limit);

  return axios.get(`/stock/advanced-search?${params.toString()}`);
};

export const createInitialStockRequest = (
  payload: CreateInitialStockPayload,
): Promise<AxiosResponse<ApiResponse<StockResponse>>> => {
  return axios.post("/stock", payload);
};

export const getCriticalStockReportRequest = (
  filters: CriticalStockReportFilters,
): Promise<AxiosResponse<ApiResponse<CriticalStockReportResponse[]>>> => {
  const params = new URLSearchParams();

  appendParam(params, "maxQuantity", filters.maxQuantity);
  appendParam(params, "idDeposit", filters.idDeposit);
  appendParam(params, "search", filters.search?.trim());
  appendParam(params, "alertStatus", filters.alertStatus);

  const query = params.toString();

  return axios.get(`/stock/report/critical${query ? `?${query}` : ""}`);
};

export const getStockByProductAndDepositRequest = (
  idProduct: number,
  idDeposit: number,
): Promise<AxiosResponse<ApiResponse<StockBalanceResponse>>> => {
  return axios.get("/stock/balance", {
    params: {
      idProduct,
      idDeposit,
    },
  });
};

export const searchProductsForStockRequest = (
  query: StockProductSearchQuery,
): Promise<AxiosResponse<ApiResponse<StockProductSearchResponse[]>>> => {
  const params = new URLSearchParams();

  appendParam(params, "search", query.search.trim());
  appendParam(params, "limit", query.limit ?? 8);

  return axios.get(`/stock/products/search?${params.toString()}`);
};
