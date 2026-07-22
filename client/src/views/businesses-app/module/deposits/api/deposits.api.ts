import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreateDepositBody,
  DepositResponse,
  UpdateDepositBody,
} from "../types/deposits.types";

export const getDepositsRequest = (): Promise<
  AxiosResponse<ApiResponse<DepositResponse[]>>
> => {
  return axios.get("/deposits");
};

export const getDepositByIdRequest = (
  idDeposit: number,
): Promise<AxiosResponse<ApiResponse<DepositResponse>>> => {
  return axios.get(`/deposits/${idDeposit}`);
};

export const createDepositRequest = (
  body: CreateDepositBody,
): Promise<AxiosResponse<ApiResponse<DepositResponse>>> => {
  return axios.post("/deposits", body);
};

export const updateDepositRequest = (
  idDeposit: number,
  body: UpdateDepositBody,
): Promise<AxiosResponse<ApiResponse<DepositResponse>>> => {
  return axios.patch(`/deposits/${idDeposit}`, body);
};