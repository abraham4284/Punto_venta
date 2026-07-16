import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreateSalePayload,
  PaginatedSalesResponse,
  ProductWithStockResponse,
  SaleFilters,
  SaleResponse,
  SaleTicketResponse,
  SaleWithDetailsResponse,
} from "../types";

export const createSaleRequest = (
  payload: CreateSalePayload,
): Promise<AxiosResponse<ApiResponse<SaleResponse>>> => {
  return axios.post("/sales", payload);
};

export const getProductsByDepositRequest = (
  idDeposit: number,
): Promise<AxiosResponse<ApiResponse<ProductWithStockResponse[]>>> => {
  return axios.get(`/sales/products-by-deposit/${idDeposit}`);
};

export const getSalesRequest = (
  page: number,
  limit: number,
  filters: SaleFilters,
): Promise<AxiosResponse<ApiResponse<PaginatedSalesResponse>>> => {
  return axios.get("/sales", {
    params: {
      page,
      limit,
      idDeposit: filters.idDeposit ?? undefined,
      status: filters.status ?? undefined,
      saleNumber: filters.saleNumber.trim() || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });
};

export const getSaleByIdRequest = (
  idSale: number,
): Promise<AxiosResponse<ApiResponse<SaleWithDetailsResponse>>> => {
  return axios.get(`/sales/${idSale}`);
};

export const cancelSale = (
  idSale: number,
): Promise<AxiosResponse<ApiResponse<SaleResponse>>> => {
  return axios.patch(`/sales/${idSale}/cancel`);
};

export const getSaleTicketRequest = (
  idSale: number,
): Promise<AxiosResponse<ApiResponse<SaleTicketResponse>>> => {
  return axios.get(`/tickets/sale/${idSale}`);
};
