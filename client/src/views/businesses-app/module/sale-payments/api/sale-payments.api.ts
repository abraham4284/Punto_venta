import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "../../sales/types";
import type {
  CreateSalePaymentBody,
  SalePaymentActionBody,
  SalePaymentResponse,
  UpdateSalePaymentBody,
} from "../types";

export const getSalePaymentsRequest = (
  idSale: number,
): Promise<AxiosResponse<ApiResponse<SalePaymentResponse[]>>> => {
  return axios.get(`/sales/${idSale}/payments`);
};

export const createSalePaymentRequest = (
  idSale: number,
  body: CreateSalePaymentBody,
): Promise<AxiosResponse<ApiResponse<SalePaymentResponse>>> => {
  return axios.post(`/sales/${idSale}/payments`, body);
};

export const updateSalePaymentRequest = (
  idSalePayment: number,
  body: UpdateSalePaymentBody,
): Promise<AxiosResponse<ApiResponse<SalePaymentResponse>>> => {
  return axios.patch(`/sale-payments/${idSalePayment}`, body);
};

export const cancelSalePaymentRequest = (
  idSalePayment: number,
  body: SalePaymentActionBody,
): Promise<AxiosResponse<ApiResponse<SalePaymentResponse>>> => {
  return axios.patch(`/sale-payments/${idSalePayment}/cancel`, body);
};

export const collectSalePaymentRequest = (
  idSalePayment: number,
  body: SalePaymentActionBody = {},
): Promise<AxiosResponse<ApiResponse<SalePaymentResponse>>> => {
  return axios.patch(`/sale-payments/${idSalePayment}/collect`, body);
};

export const confirmSalePaymentRequest = (
  idSalePayment: number,
  body: SalePaymentActionBody,
): Promise<AxiosResponse<ApiResponse<SalePaymentResponse>>> => {
  return axios.patch(`/sale-payments/${idSalePayment}/confirm`, body);
};
