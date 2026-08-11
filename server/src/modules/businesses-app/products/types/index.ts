import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type ProductUnitType = "UNIT" | "KG" | "GRAM" | "LITER" | "METER";

export interface ProductDbRow {
  idProduct: number;
  idBusiness: number;
  idProductCategory: number;
  product_category_name: string;
  barcode: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cost: string | number;
  price_sale: string | number;
  price_wholesale: string | number | null;
  unit_type: ProductUnitType | null;
  stock: string | number;
  stock_min: string | number;
  is_active: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface ProductResponse {
  idProduct: number;
  idBusiness: number;
  idProductCategory: number;
  productCategoryName: string;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCost: number;
  priceSale: number;
  priceWholesale: number | null;
  unitType: ProductUnitType;
  stock: number;
  stockMin: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ProductListFilters {
  idBusiness: number;
  page: number;
  limit: number;
  search: string | null;
  idProductCategory: number | null;
  isActive: boolean | null;
}

export interface ProductListPagination {
  page: number;
  currentPage: number;
  limit: number;
  total: number;
  totalRecords: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: ProductResponse[];
  pagination: ProductListPagination;
}

export interface CreateProductPayload {
  idBusiness: number;
  idProductCategory: number;
  idDeposit: number;
  initialStock: number;
  barcode?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCost: number;
  priceSale: number;
  priceWholesale?: number | null;
  unitType: ProductUnitType;
  stockMin?: number;
}

export interface UpdateProductPayload {
  idBusiness: number;
  idProduct: number;
  idProductCategory?: number;
  barcode?: string | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCost?: number;
  priceSale?: number;
  priceWholesale?: number | null;
  unitType?: ProductUnitType;
  stockMin?: number;
}

export interface UpdateProductPricesInput {
  idBusiness: number;
  idProduct: number;
  priceCost: number;
  priceSale: number;
  priceWholesale?: number | null;
}

export interface ToggleProductStatusPayload {
  idBusiness: number;
  idProduct: number;
  isActive: boolean;
}

export interface ProductAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
