import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type PurchaseStatus = "COMPLETED" | "CANCELLED";

export interface PurchaseDetailItem {
  idProduct: number;
  idDeposit: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface CreatePurchaseInput {
  idBusiness: number;
  idUser: number;
  idSupplier?: number | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation?: string | null;
  idempotencyKey: string;
  details: PurchaseDetailItem[];
}

export interface CreatePurchaseProcedureInput extends CreatePurchaseInput {
  purchaseNumber: string;
}

export interface CreatePurchaseServiceResponse {
  purchase: PurchaseWithDetailsResponse;
  idempotentReplay: boolean;
}

export interface CancelPurchaseInput {
  idBusiness: number;
  idPurchase: number;
}

export interface GetPurchasesFilters {
  idBusiness: number;
  page: number;
  limit: number;
  offset: number;
  status?: PurchaseStatus | null;
  idSupplier?: number | null;
  idDeposit?: number | null;
  purchaseNumberSearch?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface PurchaseDbRow {
  idPurchase: number;
  purchase_number: string;
  idempotency_key?: string;
  idBusiness: number;
  idSupplier: number | null;
  supplier_name: string | null;
  idDeposit: number | null;
  deposit_name: string | null;
  idUser: number;
  user_name: string;
  purchase_date: Date;
  subtotal: string | number;
  discount_total: string | number;
  total: string | number;
  observation: string | null;
  status: PurchaseStatus;
  created_at: Date;
  updated_at: Date | null;
}

export interface IdempotencyReplayDbRow {
  alreadyProcessed: number;
}

export interface PurchaseDetailDbRow {
  idPurchaseDetail: number;
  idPurchase: number;
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
  deposit_name: string;
  product_name: string;
  barcode: string | null;
  product_image_url: string | null;
  quantity: string | number;
  unit_price: string | number;
  discount_amount: string | number;
  subtotal: string | number;
  created_at: Date;
}

export interface PurchaseResponse {
  idPurchase: number;
  purchaseNumber: string;
  idBusiness: number;
  idSupplier: number | null;
  supplierName: string | null;
  idDeposit: number | null;
  depositName: string | null;
  idUser: number;
  userName: string;
  purchaseDate: Date;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation: string | null;
  status: PurchaseStatus;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface PurchaseDetailResponse {
  idPurchaseDetail: number;
  idPurchase: number;
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
  depositName: string;
  productName: string;
  barcode: string | null;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  createdAt: Date;
}

export interface PurchaseWithDetailsResponse extends PurchaseResponse {
  details: PurchaseDetailResponse[];
}

export interface PurchasesPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface PurchasesSummary {
  total: number;
  completed: number;
  completedPercentage: number;
  cancelled: number;
  cancelledPercentage: number;
  completedTotal: number;
}

export interface PaginatedPurchasesResponse {
  purchases: PurchaseResponse[];
  pagination: PurchasesPagination;
  metrics: PurchasesSummary;
}

export interface TotalPurchasesDbRow {
  totalRecords: number;
  completedRecords: number;
  cancelledRecords: number;
  completedTotal: string | number;
}

export interface PurchaseAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
