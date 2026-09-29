export interface ProductImageDbRow {
  idProductImage: number;
  idBusiness: number;
  idProduct: number;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface ProductImageResponse {
  idProductImage: number;
  idProduct: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateProductImagePayload {
  idBusiness: number;
  idProduct: number;
  imageUrl: string;
  altText?: string | null;
}

export interface ReorderProductImagesPayload {
  idBusiness: number;
  idProduct: number;
  imageIds: number[];
}

export interface UpdateProductImageSortOrderInput {
  idBusiness: number;
  idProduct: number;
  idProductImage: number;
  sortOrder: number;
}
