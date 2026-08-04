import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  ChangePaymentMethodStatusBody,
  CreatePaymentMethodBody,
  PaymentMethodResponse,
  UpdatePaymentMethodBody,
} from "../types";

export const getPaymentMethodsRequest = (
  onlyActive = false,
): Promise<AxiosResponse<ApiResponse<PaymentMethodResponse[]>>> => {
  return axios.get("/payment-methods", {
    params: {
      onlyActive,
    },
  });
};

export const getPaymentMethodByIdRequest = (
  idPaymentMethod: number,
): Promise<AxiosResponse<ApiResponse<PaymentMethodResponse>>> => {
  return axios.get(`/payment-methods/${idPaymentMethod}`);
};

export const createPaymentMethodRequest = (
  body: CreatePaymentMethodBody,
): Promise<AxiosResponse<ApiResponse<PaymentMethodResponse>>> => {
  return axios.post("/payment-methods", body);
};

export const updatePaymentMethodRequest = (
  idPaymentMethod: number,
  body: UpdatePaymentMethodBody,
): Promise<AxiosResponse<ApiResponse<PaymentMethodResponse>>> => {
  return axios.patch(`/payment-methods/${idPaymentMethod}`, body);
};

export const changePaymentMethodStatusRequest = (
  idPaymentMethod: number,
  body: ChangePaymentMethodStatusBody,
): Promise<AxiosResponse<ApiResponse<PaymentMethodResponse>>> => {
  return axios.patch(`/payment-methods/${idPaymentMethod}/status`, body);
};

export const setDefaultPaymentMethodRequest = (
  idPaymentMethod: number,
): Promise<AxiosResponse<ApiResponse<PaymentMethodResponse>>> => {
  return axios.patch(`/payment-methods/${idPaymentMethod}/default`);
};
