import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreateProductPayload,
  ProductCategoryOption,
  ProductsListResponse,
  ProductsQueryParams,
  ProductResponse,
  UpdateProductPricesPayload,
  UpdateProductPayload,
  UpdateProductStatusPayload,
} from "../types/products.types";

const appendParam = (
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined,
) => {
  if (value === null || value === undefined || value === "") return;

  params.set(key, String(value));
};

export const getProductsRequest = (
  query: ProductsQueryParams = {},
): Promise<AxiosResponse<ApiResponse<ProductsListResponse>>> => {
  const params = new URLSearchParams();

  appendParam(params, "page", query.page);
  appendParam(params, "limit", query.limit);
  appendParam(params, "search", query.search);
  appendParam(params, "idProductCategory", query.idProductCategory);
  appendParam(params, "isActive", query.isActive);

  const queryString = params.toString();

  return axios.get(`/products${queryString ? `?${queryString}` : ""}`);
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
