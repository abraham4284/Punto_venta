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
  StockCategoryOption,
  StockInventoryExport,
  StockInventoryFilters,
  StockProductSearchQuery,
  StockProductSearchResponse,
  StockResponse,
} from "../types/stock.types";
import { STOCK_CATEGORY_LIMIT } from "../helpers/stock-inventory.helper";

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

const inventoryParams = (filters: StockInventoryFilters) => {
  const params = new URLSearchParams();

  appendParam(params, "search", filters.search.trim());
  appendParam(params, "idDeposit", filters.idDeposit);
  appendParam(params, "quantity", filters.quantity);
  appendParam(params, "minQuantity", filters.minQuantity);
  appendParam(params, "maxQuantity", filters.maxQuantity);
  appendParam(params, "alertStatus", filters.alertStatus);
  const ids = [...new Set(filters.categoryIds)];
  if (ids.length > STOCK_CATEGORY_LIMIT || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new RangeError("Seleccioná hasta 30 categorías válidas.");
  }
  if (ids.length) params.set("categoryIds", ids.join(","));
  return params;
};

export const getAdvancedStockInventoryRequest = (
  filters: AdvancedStockFilters,
): Promise<AxiosResponse<ApiResponse<AdvancedStockResponse>>> => {
  const params = inventoryParams(filters);
  appendParam(params, "page", filters.page);
  appendParam(params, "limit", filters.limit);

  return axios.get(`/stock/advanced-search?${params.toString()}`);
};

export const getStockCategoryOptionsRequest = (signal: AbortSignal) =>
  axios.get<ApiResponse<StockCategoryOption[]>>("/stock/category-options", { signal, timeout: 15_000 });

export const getStockInventoryExportRequest = (filters: StockInventoryFilters, signal: AbortSignal) => {
  const query = inventoryParams(filters).toString();
  return axios.get<ApiResponse<StockInventoryExport>>(
    `/stock/export-data${query ? `?${query}` : ""}`,
    { signal, timeout: 30_000 },
  );
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
