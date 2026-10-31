import axios from "@/api/axios.config";
import type { ConvertOrderPayload, ConvertOrderResult, CreateOrderPayload, Order, OrderEvent, OrderFilters, OrderList, OrderProducts, OrdersResponse, UpdateOrderPayload } from "../types/orders.types";

export const createOrderRequest = (payload: CreateOrderPayload, key: string) =>
  axios.post<OrdersResponse<Order>>("/orders", payload, { headers: { "Idempotency-Key": key } });
export const listOrdersRequest = (filters: OrderFilters, signal?: AbortSignal) =>
  axios.get<OrdersResponse<OrderList>>("/orders", { params: filters, signal });
export const getOrderRequest = (id: number, signal?: AbortSignal) =>
  axios.get<OrdersResponse<Order>>(`/orders/${id}`, { signal });
export const updateOrderRequest = (id: number, payload: UpdateOrderPayload) =>
  axios.put<OrdersResponse<Order>>(`/orders/${id}`, payload);
export const getOrderEventsRequest = (id: number, signal?: AbortSignal) =>
  axios.get<OrdersResponse<OrderEvent[]>>(`/orders/${id}/events`, { signal });
export const changeOrderStatusRequest = (id: number, status: "CONFIRMED" | "PREPARING" | "READY") =>
  axios.patch<OrdersResponse<Order>>(`/orders/${id}/status`, { status });
export const cancelOrderRequest = (id: number, reason: string) =>
  axios.patch<OrdersResponse<Order>>(`/orders/${id}/cancel`, { reason });
export const getOrderProductsRequest = (idDeposit: number, params: { page: number; limit: number; search?: string }, signal?: AbortSignal) =>
  axios.get<OrdersResponse<OrderProducts>>(`/orders/products-by-deposit/${idDeposit}`, { params, signal });

export const convertOrderToSaleRequest = (id: number, payload: ConvertOrderPayload, key: string) =>
  axios.post<OrdersResponse<ConvertOrderResult>>(`/orders/${id}/convert-to-sale`, payload, { headers: { "Idempotency-Key": key } });
