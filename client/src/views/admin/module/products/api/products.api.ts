import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreateProductPayload,
  ProductCategoryOption,
  ProductResponse,
  UpdateProductPricesPayload,
  UpdateProductPayload,
  UpdateProductStatusPayload,
} from "../types/products.types";

export const getProductsRequest = (): Promise<
  AxiosResponse<ApiResponse<ProductResponse[]>>
> => {
  return axios.get("/products");
};

export const getProductByIdRequest = (
  idProduct: number,
): Promise<AxiosResponse<ApiResponse<ProductResponse>>> => {
  return axios.get(`/products/${idProduct}`);
};

export const createProductRequest = (
  payload: CreateProductPayload,
): Promise<AxiosResponse<ApiResponse<ProductResponse>>> => {
  return axios.post("/products", payload);
};

export const updateProductRequest = (
  idProduct: number,
  payload: UpdateProductPayload,
): Promise<AxiosResponse<ApiResponse<ProductResponse>>> => {
  return axios.put(`/products/${idProduct}`, payload);
};

export const updateProductStatusRequest = (
  idProduct: number,
  payload: UpdateProductStatusPayload,
): Promise<AxiosResponse<ApiResponse<ProductResponse>>> => {
  return axios.patch(`/products/${idProduct}/status`, payload);
};

export const updateProductPrices = (
  idProduct: number,
  payload: UpdateProductPricesPayload,
): Promise<AxiosResponse<ApiResponse<ProductResponse>>> => {
  return axios.patch(`/products/${idProduct}/prices`, payload);
};

export const getProductCategoriesOptionsRequest = (): Promise<
  AxiosResponse<ApiResponse<ProductCategoryOption[]>>
> => {
  return axios.get("/product-categories");
};
