import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type {
  CreateProductCategoryBody,
  ProductCategoryResponse,
  UpdateProductCategoryBody,
  UpdateProductCategoryStatusBody,
} from "../types/productCategories.types";

export const getProductCategoriesRequest = (): Promise<
  AxiosResponse<ApiResponse<ProductCategoryResponse[]>>
> => {
  return axios.get("/product-categories");
};

export const createProductCategoryRequest = (
  body: CreateProductCategoryBody,
): Promise<AxiosResponse<ApiResponse<ProductCategoryResponse>>> => {
  return axios.post("/product-categories", body);
};

export const updateProductCategoryRequest = (
  idProductCategory: number,
  body: UpdateProductCategoryBody,
): Promise<AxiosResponse<ApiResponse<ProductCategoryResponse>>> => {
  return axios.patch(`/product-categories/${idProductCategory}`, body);
};

export const updateProductCategoryStatusRequest = (
  idProductCategory: number,
  body: UpdateProductCategoryStatusBody,
): Promise<AxiosResponse<ApiResponse<ProductCategoryResponse>>> => {
  return axios.patch(`/product-categories/${idProductCategory}/status`, body);
};
