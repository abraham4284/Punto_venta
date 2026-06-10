import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreateSalePayload,
  ProductWithStockResponse,
  SaleResponse,
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
