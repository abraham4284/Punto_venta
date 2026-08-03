export type CashSessionStatus = "OPEN" | "CLOSED";
export type CashMovementType = "INCOME" | "EXPENSE";

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
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

export interface CashRegisterResponse {
  idCashRegister: number;
  idBusiness: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  hasOpenSession: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashSessionResponse {
  idCashSession: number;
  idBusiness: number;
  idCashRegister: number;
  cashRegisterName: string;
  cashRegisterIsDefault: boolean;
  openedByUserId: number;
  openedByUserName: string;
  closedByUserId: number | null;
  closedByUserName: string | null;
  status: CashSessionStatus;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  expectedCashAmount: number | null;
  countedCashAmount: number | null;
  differenceAmount: number | null;
  openingObservation: string | null;
  closingObservation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashPaymentSummaryResponse {
  idPaymentMethod: number;
  paymentMethodCode: string;
  paymentMethodName: string;
  affectsCash: boolean;
  salesCount: number;
  totalAmount: number;
}

export interface CashLiveSummaryResponse {
  idCashSession: number;
  idBusiness: number;
  idCashRegister: number;
  cashRegisterName: string;
  status: CashSessionStatus;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  cashSales: number;
  nonCashSales: number;
  manualIncome: number;
  manualExpense: number;
  expectedCash: number;
  totalSales: number;
  salesCount: number;
  cancelledSalesCount: number;
  summaryByPaymentMethod: CashPaymentSummaryResponse[];
}

export interface CashMovementResponse {
  idCashMovement: number;
  idBusiness: number;
  idCashSession: number;
  idUser: number;
  userName: string;
  movementType: CashMovementType;
  category: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface CashSessionPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface PaginatedCashSessionsResponse {
  sessions: CashSessionResponse[];
  pagination: CashSessionPagination;
}

export interface CreateCashRegisterBody {
  name: string;
  description: string | null;
  isDefault: boolean;
}

export type UpdateCashRegisterBody = CreateCashRegisterBody;

export interface OpenCashSessionBody {
  idCashRegister: number;
  openingAmount: number;
  openingObservation: string | null;
}

export interface CloseCashSessionBody {
  countedCashAmount: number;
  closingObservation: string | null;
}

export interface CreateCashMovementBody {
  movementType: CashMovementType;
  category: string;
  amount: number;
  description: string | null;
}

export interface CashSessionFilters {
  idCashRegister: number | null;
  idUser: number | null;
  status: CashSessionStatus | null;
  startDate: string;
  endDate: string;
}
