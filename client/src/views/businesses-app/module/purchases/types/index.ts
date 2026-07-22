export type PurchaseStatus = "COMPLETED" | "CANCELLED";

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  status: boolean;
  message: string;
  errors?: FieldError[];
}

export interface PurchaseDetailPayload {
  idProduct: number;
  idDeposit: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface CreatePurchasePayload {
  idSupplier: number | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation: string | null;
  details: PurchaseDetailPayload[];
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
  purchaseDate: Date | string;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation: string | null;
  status: PurchaseStatus;
  createdAt: Date | string;
  updatedAt: Date | string | null;
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
  createdAt: Date | string;
}

export interface PurchaseWithDetailsResponse extends PurchaseResponse {
  details: PurchaseDetailResponse[];
}

export interface PurchaseCartItem {
  idProduct: number;
  productName: string;
  barcode: string | null;
  imageUrl: string | null;
  idDeposit: number;
  depositName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface PurchaseFilters {
  page: number;
  limit: number;
  purchaseNumber: string;
  idSupplier: number | null;
  idDeposit: number | null;
  status: PurchaseStatus | null;
  startDate: string;
  endDate: string;
}

export interface PurchasesPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface PurchasesMetrics {
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
  metrics: PurchasesMetrics;
}
