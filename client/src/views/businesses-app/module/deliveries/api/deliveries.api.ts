import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "../../sales/types";
import type {
  DeliveryActionBody,
  DeliveryEventResponse,
  DeliveryFilters,
  DeliveryResponse,
  DeliveryUserOption,
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

export const getDeliveryEventsRequest = (
  idSaleDelivery: number,
): Promise<AxiosResponse<ApiResponse<DeliveryEventResponse[]>>> => {
  return axios.get(`/deliveries/${idSaleDelivery}/events`);
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

export const getDeliveryUsersRequest = (): Promise<
  AxiosResponse<ApiResponse<DeliveryUserOption[]>>
> => {
  return axios.get("/sales/delivery-users");
};
