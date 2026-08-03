import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CashLiveSummaryResponse,
  CashMovementResponse,
  CashRegisterResponse,
  CashSessionFilters,
  CashSessionResponse,
  CloseCashSessionBody,
  CreateCashMovementBody,
  CreateCashRegisterBody,
  OpenCashSessionBody,
  PaginatedCashSessionsResponse,
  UpdateCashRegisterBody,
} from "../types";

export const getCashRegistersRequest = (): Promise<
  AxiosResponse<ApiResponse<CashRegisterResponse[]>>
> => {
  return axios.get("/cash-registers");
};

export const createCashRegisterRequest = (
  body: CreateCashRegisterBody,
): Promise<AxiosResponse<ApiResponse<CashRegisterResponse>>> => {
  return axios.post("/cash-registers", body);
};

export const updateCashRegisterRequest = (
  idCashRegister: number,
  body: UpdateCashRegisterBody,
): Promise<AxiosResponse<ApiResponse<CashRegisterResponse>>> => {
  return axios.patch(`/cash-registers/${idCashRegister}`, body);
};

export const changeCashRegisterStatusRequest = (
  idCashRegister: number,
  isActive: boolean,
): Promise<AxiosResponse<ApiResponse<CashRegisterResponse>>> => {
  return axios.patch(`/cash-registers/${idCashRegister}/status`, { isActive });
};

export const setDefaultCashRegisterRequest = (
  idCashRegister: number,
): Promise<AxiosResponse<ApiResponse<CashRegisterResponse>>> => {
  return axios.patch(`/cash-registers/${idCashRegister}/default`);
};

export const getCurrentCashSessionRequest = (
  idCashRegister?: number | null,
): Promise<AxiosResponse<ApiResponse<CashSessionResponse | null>>> => {
  return axios.get("/cash-sessions/current", {
    params: { idCashRegister: idCashRegister ?? undefined },
  });
};

export const openCashSessionRequest = (
  body: OpenCashSessionBody,
): Promise<AxiosResponse<ApiResponse<CashSessionResponse>>> => {
  return axios.post("/cash-sessions/open", body);
};

export const closeCashSessionRequest = (
  idCashSession: number,
  body: CloseCashSessionBody,
): Promise<
  AxiosResponse<
    ApiResponse<{
      session: CashSessionResponse;
      paymentSummaries: CashLiveSummaryResponse["summaryByPaymentMethod"];
    }>
  >
> => {
  return axios.post(`/cash-sessions/${idCashSession}/close`, body);
};

export const getCashSessionSummaryRequest = (
  idCashSession: number,
): Promise<AxiosResponse<ApiResponse<CashLiveSummaryResponse>>> => {
  return axios.get(`/cash-sessions/${idCashSession}/summary`);
};

export const getCashSessionsRequest = (
  page: number,
  limit: number,
  filters: CashSessionFilters,
): Promise<AxiosResponse<ApiResponse<PaginatedCashSessionsResponse>>> => {
  return axios.get("/cash-sessions", {
    params: {
      page,
      limit,
      idCashRegister: filters.idCashRegister ?? undefined,
      idUser: filters.idUser ?? undefined,
      status: filters.status ?? undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });
};

export const createCashMovementRequest = (
  idCashSession: number,
  body: CreateCashMovementBody,
): Promise<AxiosResponse<ApiResponse<CashMovementResponse>>> => {
  return axios.post(`/cash-sessions/${idCashSession}/movements`, body);
};

export const getCashMovementsRequest = (
  idCashSession: number,
): Promise<AxiosResponse<ApiResponse<CashMovementResponse[]>>> => {
  return axios.get(`/cash-sessions/${idCashSession}/movements`);
};
