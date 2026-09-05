import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "../../sales/types";
import type {
  DeliveryActionBody,
  DeliveryFilters,
  DeliveryResponse,
  PaginatedDeliveriesResponse,
} from "../types";

export const getDeliveriesRequest = (
  page: number,
  limit: number,
  filters: DeliveryFilters,
): Promise<AxiosResponse<ApiResponse<PaginatedDeliveriesResponse>>> => {
  return axios.get("/deliveries", {
    params: {
      page,
      limit,
      search: filters.search.trim() || undefined,
      status: filters.status || undefined,
      assignedToUserId: filters.assignedToUserId ?? undefined,
    },
  });
};

export const getDeliveryByIdRequest = (
  idSaleDelivery: number,
): Promise<AxiosResponse<ApiResponse<DeliveryResponse>>> => {
  return axios.get(`/deliveries/${idSaleDelivery}`);
};

export const assignDeliveryRequest = (
  idSaleDelivery: number,
  body: DeliveryActionBody,
): Promise<AxiosResponse<ApiResponse<DeliveryResponse>>> => {
  return axios.patch(`/deliveries/${idSaleDelivery}/assign`, body);
};

export const startDeliveryRequest = (
  idSaleDelivery: number,
): Promise<AxiosResponse<ApiResponse<DeliveryResponse>>> => {
  return axios.patch(`/deliveries/${idSaleDelivery}/start`);
};

export const failDeliveryRequest = (
  idSaleDelivery: number,
  body: DeliveryActionBody,
): Promise<AxiosResponse<ApiResponse<DeliveryResponse>>> => {
  return axios.patch(`/deliveries/${idSaleDelivery}/fail`, body);
};

export const rescheduleDeliveryRequest = (
  idSaleDelivery: number,
  body: DeliveryActionBody,
): Promise<AxiosResponse<ApiResponse<DeliveryResponse>>> => {
  return axios.patch(`/deliveries/${idSaleDelivery}/reschedule`, body);
};

export const deliverDeliveryRequest = (
  idSaleDelivery: number,
): Promise<AxiosResponse<ApiResponse<DeliveryResponse>>> => {
  return axios.patch(`/deliveries/${idSaleDelivery}/deliver`);
};

export const cancelDeliveryRequest = (
  idSaleDelivery: number,
  body: DeliveryActionBody = {},
): Promise<AxiosResponse<ApiResponse<DeliveryResponse>>> => {
  return axios.patch(`/deliveries/${idSaleDelivery}/cancel`, body);
};
