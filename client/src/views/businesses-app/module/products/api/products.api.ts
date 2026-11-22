import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  ApiResponse,
  CreateProductPayload,
  ProductDetailResponse,
  ProductCategoryOption,
  ProductsListResponse,
  ProductsQueryParams,
  ProductResponse,
  ProductPriceLabelsQuery,
  ProductPriceLabelsData,
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
): Promise<AxiosResponse<ApiResponse<ProductDetailResponse>>> => {
  return axios.get(`/products/${idProduct}`);
};

export const getProductPriceLabelsRequest = (query: ProductPriceLabelsQuery, signal: AbortSignal) => {
  const params = new URLSearchParams();
  appendParam(params, "search", query.search?.trim());
  appendParam(params, "idProductCategory", query.idProductCategory);
  appendParam(params, "isActive", query.isActive);
  if (query.ids) {
    if (!query.ids.length || query.ids.length > 2000 || query.ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      throw new RangeError("Seleccioná entre 1 y 2.000 productos válidos.");
    }
    params.set("ids", [...new Set(query.ids)].join(","));
  }
  return axios.get<ApiResponse<ProductPriceLabelsData>>(`/products/price-labels?${params.toString()}`, {
    signal, timeout: 30_000,
  });
};

export const createProductRequest = (
  payload: CreateProductPayload,
): Promise<AxiosResponse<ApiResponse<ProductDetailResponse>>> => {
  return axios.post("/products", payload);
};

export const updateProductRequest = (
  idProduct: number,
  payload: UpdateProductPayload,
): Promise<AxiosResponse<ApiResponse<ProductDetailResponse>>> => {
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
