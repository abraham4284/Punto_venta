import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type ProductUnitType = "UNIT" | "KG" | "GRAM" | "LITER" | "METER";
export type AdvancedStockAlertStatus = "OK" | "LOW" | "ZERO";

export interface StockDbRow {
  idStock: number;
  idBusiness: number;
  business_name: string;
  idProduct: number;
  product_name: string;
  product_image_url: string | null;
  product_unit_type: ProductUnitType;
  is_active: number | boolean;
  category_name: string;
  idDeposit: number;
  deposit_name: string;
  quantity: string | number;
  updated_at: Date | null;
  stock_min: number;
}

export interface StockResponse {
  idStock: number;
  idBusiness: number;
  businessName: string;
  idProduct: number;
  productName: string;
  productImageUrl: string | null;
  unitType: ProductUnitType;
  isActive: boolean;
  categoryName: string;
  idDeposit: number;
  depositName: string;
  quantity: number;
  updatedAt: Date | null;
  stock_min: number;
}

export interface StockPaginationFilters {
  page: number;
  limit: number;
}

export interface StockPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface StockPaginatedResponse {
  stock: StockResponse[];
  pagination: StockPagination;
}

export interface StockCountRow {
  totalRecords: string | number;
}

export interface StockProductSearchRow {
  idProduct: number;
  idBusiness: number;
  idProductCategory: number;
  product_category_name: string | null;
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
  is_active: number | boolean;
  created_at: Date;
  updated_at: Date | null;
}

export interface StockProductSearchResponse {
  idProduct: number;
  idBusiness: number;
  idProductCategory: number;
  productCategoryName: string | null;
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

export interface StockProductSearchFilters {
  search: string | null;
  limit: number;
}

export interface CreateInitialStockPayload {
  idBusiness: number;
  idUser: number;
  idProduct: number;
  idDeposit: number;
  quantity: number;
  observation?: string | null;
}

export interface StockBalanceDbRow {
  idStock: number;
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
  quantity: string | number;
  updated_at: Date | null;
}

export interface StockBalanceResponse {
  idStock: number | null;
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
  quantity: number;
  exists: boolean;
  updatedAt: Date | null;
}

export type CriticalStockAlertStatus =
  | "CRITICAL_ZERO"
  | "CRITICAL_LOW"
  | "CRITICAL_EQUAL";

export interface CriticalStockReportRow {
  idStock: number;
  idBusiness: number;
  idProduct: number;
  product_name: string;
  barcode: string | null;
  image_url: string | null;
  unit_type: ProductUnitType;
  price_cost: string | number;
  idDeposit: number;
  deposit_name: string;
  quantity: string | number;
  stock_min: string | number;
  alert_status: CriticalStockAlertStatus;
  alert_message: string;
}

export interface CriticalStockReportResponse {
  idStock: number;
  idBusiness: number;
  idProduct: number;
  productName: string;
  barcode: string | null;
  imageUrl: string | null;
  unitType: ProductUnitType;
  priceCost: number;
  idDeposit: number;
  depositName: string;
  quantity: number;
  stockMin: number;
  alertStatus: CriticalStockAlertStatus;
  alertMessage: string;
}

export interface CriticalStockReportFilters {
  idBusiness: number;
  maxQuantity?: number | null;
  idDeposit?: number | null;
  searchProduct?: string | null;
  alertStatus?: CriticalStockAlertStatus | null;
}

export interface StockInventoryFilters {
  search?: string | null;
  idDeposit?: number | null;
  quantity?: number | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  alertStatus?: AdvancedStockAlertStatus | null;
  categoryIds?: number[];
}

export interface AdvancedStockFilters extends StockInventoryFilters {
  page: number;
  limit: number;
}

export interface StockInventoryRow {
  idStock: number;
  idProduct: number;
  productName: string;
  categoryName: string | null;
  barcode: string | null;
  imageUrl: string | null;
  unitType: ProductUnitType;
  isActive: number | boolean;
  idDeposit: number;
  depositName: string;
  quantity: string | number;
  stockMin: string | number;
  alertStatus: AdvancedStockAlertStatus;
}

export interface AdvancedStockInventoryRow extends StockInventoryRow {
  priceCost: string | number;
  priceSale: string | number;
}

export interface StockInventoryItem {
  idStock: number;
  idProduct: number;
  productName: string;
  categoryName: string | null;
  barcode: string | null;
  imageUrl: string | null;
  unitType: ProductUnitType;
  isActive: boolean;
  idDeposit: number;
  depositName: string;
  quantity: number;
  stockMin: number;
  alertStatus: AdvancedStockAlertStatus;
}

export interface AdvancedStockInventoryItem extends StockInventoryItem {
  priceCost: number;
  priceSale: number;
}

export interface StockInventoryExportResponse {
  stock: StockInventoryItem[];
  totalRecords: number;
}

export interface StockCategoryOption {
  idProductCategory: number;
  name: string;
}

export interface AdvancedStockPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface AdvancedStockResponse {
  stock: AdvancedStockInventoryItem[];
  pagination: AdvancedStockPagination;
}

export interface AdvancedStockCountRow {
  totalRecords: string | number;
}

export interface StockAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
