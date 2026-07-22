import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type ManualAdjustmentType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";

export interface StockMovementDbRow {
  idStockMovement: number;
  idBusiness: number;
  business_name: string;
  idProduct: number;
  product_name: string;
  product_image_url: string | null;
  idUser: number;
  user_name: string;
  movement_type:
    | "PURCHASE"
    | "SALE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT";
  idDepositFrom: number | null;
  deposit_from_name: string | null;
  idDepositTo: number | null;
  deposit_to_name: string | null;
  quantity: string | number;
  reference_type: "SALE" | "PURCHASE" | "TRANSFER" | "ADJUSTMENT" | null;
  reference_id: number | null;
  observation: string | null;
  created_at: Date;
}

export interface StockMovementResponse {
  idStockMovement: number;
  idBusiness: number;
  businessName: string;
  idProduct: number;
  productName: string;
  productImageUrl: string | null;
  idUser: number;
  userName: string;
  movementType: StockMovementDbRow["movement_type"];
  idDepositFrom: number | null;
  depositFromName: string | null;
  idDepositTo: number | null;
  depositToName: string | null;
  quantity: number;
  referenceType: StockMovementDbRow["reference_type"];
  referenceId: number | null;
  observation: string | null;
  createdAt: Date;
}

export interface GetStockMovementsParams {
  idBusiness: number;
  limit: number;
  offset: number;
  movementType?: string | null;
  idDeposit?: number | null;
  search?: string | null;
}

export interface StockMovementPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface StockMovementsPaginatedResponse {
  movements: StockMovementResponse[];
  pagination: StockMovementPagination;
}

export interface StockMovementCountRow {
  totalRecords: string | number;
}

export interface ProcessStockAdjustmentPayload {
  idBusiness: number;
  idUser: number;
  idProduct: number;
  idDeposit: number;
  quantity: number;
  type: ManualAdjustmentType;
  observation?: string | null;
}

export interface ProcessStockTransferPayload {
  idBusiness: number;
  idUser: number;
  idProduct: number;
  idDepositFrom: number;
  idDepositTo: number;
  quantity: number;
  observation?: string | null;
}

export interface StockMovementAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
