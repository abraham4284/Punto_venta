import type { ProductUnitType } from "../../products/types/products.types";

export type AdvancedStockAlertStatus = "OK" | "LOW" | "ZERO";

export interface StockDbRow {
  idStock: number;
  idBusiness: number;
  business_name: string;
  idProduct: number;
  product_name: string;
  product_image_url: string | null;
  product_unit_type?: ProductUnitType;
  category_name: string;
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
  barcode: string | null;
  productImageUrl: string | null;
  unitType: ProductUnitType;
  categoryName: string;
  priceCost: number;
  priceSale: number;
  idDeposit: number;
  depositName: string;
  quantity: number;
  updatedAt: Date | null;
  stock_min: number;
}

export interface AdvancedStockFilters {
  search: string;
  idDeposit: number | null;
  quantity: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  alertStatus: AdvancedStockAlertStatus | null;
  page: number;
  limit: number;
}

export interface AdvancedStockInventoryItem {
  idStock: number;
  idProduct: number;
  productName: string;
  categoryName: string | null;
  barcode: string | null;
  imageUrl: string | null;
  unitType: ProductUnitType;
  priceCost: number;
  priceSale: number;
  idDeposit: number;
  depositName: string;
  quantity: number;
  stockMin: number;
  alertStatus: AdvancedStockAlertStatus;
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

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  status: boolean;
  message: string;
  errors?: FieldError[];
}

export type StockOperationType =
  | "INITIAL_STOCK"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "TRANSFER";

export interface CreateInitialStockPayload {
  idProduct: number;
  idDeposit: number;
  quantity: number;
  observation?: string | null;
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

export interface ProcessStockAdjustmentPayload {
  idProduct: number;
  idDeposit: number;
  quantity: number;
  type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  observation?: string | null;
}

export interface ProcessStockTransferPayload {
  idProduct: number;
  idDepositFrom: number;
  idDepositTo: number;
  quantity: number;
  observation?: string | null;
}

export interface StockMovementResponse {
  idStockMovement: number;
  idBusiness: number;
  businessName: string;
  idProduct: number;
  productName: string;
  imageUrl?: string | null;
  productImageUrl: string | null;
  idUser: number;
  userName: string;
  movementType:
    | "PURCHASE"
    | "SALE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT";
  idDepositFrom: number | null;
  depositFromName: string | null;
  idDepositTo: number | null;
  depositToName: string | null;
  quantity: number;
  referenceType: "SALE" | "PURCHASE" | "TRANSFER" | "ADJUSTMENT" | null;
  referenceId: number | null;
  observation: string | null;
  createdAt: Date;
}

export type StockMovementType = StockMovementResponse["movementType"];

export type StockMovementFilter = "ALL" | "IN" | "OUT" | "TRANSFER";

export interface StockMovementMetrics {
  total: number;
  entriesVolume: number;
  outputsVolume: number;
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

export interface StockMovementQueryParams {
  page: number;
  limit: number;
  movementType?: StockMovementFilter;
  idDeposit?: number | null;
  search?: string;
}

export interface StockFormValues {
  idProduct: string;
  operationType: StockOperationType | "";
  idDeposit: string;
  idDepositFrom: string;
  idDepositTo: string;
  quantity: string;
  observation: string;
}

export interface StockMetrics {
  total: number;
  totalUnits: number;
  zeroStock: number;
  lowStock: number;
  uniqueProducts: number;
  activeDeposits: number;
}

export type CriticalStockAlertStatus =
  | "CRITICAL_ZERO"
  | "CRITICAL_LOW"
  | "CRITICAL_EQUAL";

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
  maxQuantity?: number | null;
  idDeposit?: number | null;
  search?: string | null;
  alertStatus?: CriticalStockAlertStatus | null;
}

export interface CriticalStockMetrics {
  totalRestockItems: number;
  zeroStock: number;
  lowStock: number;
  equalStock: number;
}
