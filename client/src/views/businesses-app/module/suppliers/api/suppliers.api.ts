import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreateSupplierBody,
  SupplierResponse,
  UpdateSupplierBody,
} from "../types";

export const createSupplierRequest = (
  body: CreateSupplierBody,
): Promise<AxiosResponse<ApiResponse<SupplierResponse>>> => {
  return axios.post("/suppliers", body);
};

export const getSuppliersRequest = (): Promise<
  AxiosResponse<ApiResponse<SupplierResponse[]>>
> => {
  return axios.get("/suppliers");
};

export const getSupplierByIdRequest = (
  idSupplier: number,
): Promise<AxiosResponse<ApiResponse<SupplierResponse>>> => {
  return axios.get(`/suppliers/${idSupplier}`);
};

export const updateSupplierRequest = (
  idSupplier: number,
  body: UpdateSupplierBody,
): Promise<AxiosResponse<ApiResponse<SupplierResponse>>> => {
  return axios.patch(`/suppliers/${idSupplier}`, body);
};
