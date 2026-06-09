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
