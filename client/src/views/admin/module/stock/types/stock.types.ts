export interface StockDbRow {
  idStock: number;
  idBusiness: number;
  business_name: string;
  idProduct: number;
  product_name: string;
  product_image_url: string | null;
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
  productImageUrl: string | null;
  categoryName: string;
  idDeposit: number;
  depositName: string;
  quantity: number;
  updatedAt: Date | null;
  stock_min: number;
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
}

export type CriticalStockAlertStatus =
  | "CRITICAL_ZERO"
  | "CRITICAL_LOW"
  | "CRITICAL_EQUAL"
  | "STOCK_OK";

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
  maxQuantity: number;
  idDeposit?: number | null;
  search?: string | null;
}

export interface CriticalStockMetrics {
  totalCriticalRisk: number;
  zeroStock: number;
  insufficientStock: number;
}
