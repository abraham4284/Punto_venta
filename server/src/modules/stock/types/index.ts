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
}

export interface CreateInitialStockPayload {
  idBusiness: number;
  idUser: number;
  idProduct: number;
  idDeposit: number;
  quantity: number;
  observation?: string | null;
}

export interface StockAuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
