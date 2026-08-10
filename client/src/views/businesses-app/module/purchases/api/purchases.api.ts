import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreatePurchasePayload,
  PaginatedPurchasesResponse,
  PurchaseFilters,
  PurchaseWithDetailsResponse,
} from "../types";

export const createPurchaseApi = (
  payload: CreatePurchasePayload,
  idempotencyKey: string,
): Promise<AxiosResponse<ApiResponse<PurchaseWithDetailsResponse>>> => {
  return axios.post("/purchases", payload, {
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
};

export const getPurchasesApi = (
  params: PurchaseFilters,
): Promise<AxiosResponse<ApiResponse<PaginatedPurchasesResponse>>> => {
  return axios.get("/purchases", {
    params: {
      page: params.page,
      limit: params.limit,
      purchaseNumber: params.purchaseNumber.trim() || undefined,
      idSupplier: params.idSupplier ?? undefined,
      idDeposit: params.idDeposit ?? undefined,
      status: params.status ?? undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    },
  });
};

export const getPurchaseByIdApi = (
  idPurchase: number,
): Promise<AxiosResponse<ApiResponse<PurchaseWithDetailsResponse>>> => {
  return axios.get(`/purchases/${idPurchase}`);
};

export const cancelPurchaseApi = (
  idPurchase: number,
): Promise<AxiosResponse<ApiResponse<PurchaseWithDetailsResponse>>> => {
  return axios.patch(`/purchases/${idPurchase}/cancel`);
};
