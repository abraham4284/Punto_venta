import type { Request } from "express";
import type { AccessTokenPayload } from "@/libs/tokens.js";

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
  stockMin: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateProductPayload {
  idBusiness: number;
  idProductCategory: number;
  idDeposit: number;
  stock: number;
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
  user: AccessTokenPayload;
}
