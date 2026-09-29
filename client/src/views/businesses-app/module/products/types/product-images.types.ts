import type { ApiResponse } from "./products.types";

export interface ProductImageResponse {
  idProductImage: number;
  idProduct: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateProductImagePayload {
  imageUrl: string;
  altText?: string | null;
}

export interface ReorderProductImagesPayload {
  imageIds: number[];
}

export type ProductImagesApiResponse<T> = ApiResponse<T>;
