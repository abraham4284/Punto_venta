import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type {
  CreateProductImagePayload,
  ProductImageResponse,
  ProductImagesApiResponse,
  ReorderProductImagesPayload,
} from "../types/product-images.types";

export const getProductImagesRequest = (
  idProduct: number,
): Promise<AxiosResponse<ProductImagesApiResponse<ProductImageResponse[]>>> => {
  return axios.get(`/products/${idProduct}/images`);
};

export const createProductImageRequest = (
  idProduct: number,
  payload: CreateProductImagePayload,
): Promise<AxiosResponse<ProductImagesApiResponse<ProductImageResponse>>> => {
  return axios.post(`/products/${idProduct}/images`, payload);
};

export const reorderProductImagesRequest = (
  idProduct: number,
  payload: ReorderProductImagesPayload,
): Promise<AxiosResponse<ProductImagesApiResponse<ProductImageResponse[]>>> => {
  return axios.patch(`/products/${idProduct}/images/order`, payload);
};

export const deleteProductImageRequest = (
  idProduct: number,
  idProductImage: number,
): Promise<AxiosResponse<ProductImagesApiResponse<null>>> => {
  return axios.delete(`/products/${idProduct}/images/${idProductImage}`);
};
