import type { Request } from "express";
import type { AccessTokenPayload } from "@/libs/tokens.js";

export interface StockDbRow {
  idStock: number;
  idBusiness: number;
  business_name: string;
  idProduct: number;
  product_name: string;
  product_image_url: string | null;
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
  idDeposit: number;
  depositName: string;
  quantity: number;
  updatedAt: Date | null;
  stock_min: number;
}

export interface CreateInitialStockPayload {
  idBusiness: number;
  idUser: number;
  idProduct: number;
  idDeposit: number;
  quantity: number;
  observation?: string | null;
}

export type CriticalStockAlertStatus =
  | "CRITICAL_ZERO"
  | "CRITICAL_LOW"
  | "CRITICAL_EQUAL"
  | "STOCK_OK";

export interface CriticalStockReportRow {
  idStock: number;
  idBusiness: number;
  idProduct: number;
  product_name: string;
  barcode: string | null;
  image_url: string | null;
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
  idDeposit: number;
  depositName: string;
  quantity: number;
  stockMin: number;
  alertStatus: CriticalStockAlertStatus;
  alertMessage: string;
}

export interface CriticalStockReportFilters {
  idBusiness: number;
  maxQuantity: number;
  idDeposit?: number | null;
  searchProduct?: string | null;
}

export interface StockAuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
