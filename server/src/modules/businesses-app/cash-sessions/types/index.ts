export type CashSessionStatus = "OPEN" | "CLOSED";

export interface CashSessionDbRow {
  idCashSession: number;
  idBusiness: number;
  idCashRegister: number;
  cashRegisterName: string;
  cashRegisterIsDefault: number;
  opened_by_user_id: number;
  openedByUserName: string;
  closed_by_user_id: number | null;
  closedByUserName: string | null;
  status: CashSessionStatus;
  opened_at: Date;
  closed_at: Date | null;
  opening_amount: string | number;
  expected_cash_amount: string | number | null;
  counted_cash_amount: string | number | null;
  difference_amount: string | number | null;
  opening_observation: string | null;
  closing_observation: string | null;
  created_at: Date;
  updated_at: Date;
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
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  expectedCashAmount: number | null;
  countedCashAmount: number | null;
  differenceAmount: number | null;
  openingObservation: string | null;
  closingObservation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashLiveSummaryDbRow {
  idCashSession: number;
  idBusiness: number;
  idCashRegister: number;
  cashRegisterName: string;
  status: CashSessionStatus;
  opened_at: Date;
  closed_at: Date | null;
  openingAmount: string | number;
  cashSales: string | number;
  nonCashSales: string | number;
  manualIncome: string | number;
  manualExpense: string | number;
  expectedCash: string | number;
  totalSales: string | number;
  salesCount: number;
  cancelledSalesCount: number;
}

export interface CashPaymentSummaryDbRow {
  idPaymentMethod: number;
  paymentMethodCode: string;
  paymentMethodName: string;
  affectsCash: number;
  salesCount: number;
  totalAmount: string | number;
}

export interface CashSessionPaymentSummaryResponse {
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
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  cashSales: number;
  nonCashSales: number;
  manualIncome: number;
  manualExpense: number;
  expectedCash: number;
  totalSales: number;
  salesCount: number;
  cancelledSalesCount: number;
  summaryByPaymentMethod: CashSessionPaymentSummaryResponse[];
}

export interface OpenCashSessionPayload {
  idBusiness: number;
  idCashRegister: number;
  idUser: number;
  openingAmount: number;
  openingObservation?: string | null;
}

export interface CloseCashSessionPayload {
  idBusiness: number;
  idCashSession: number;
  idUser: number;
  countedCashAmount: number;
  closingObservation?: string | null;
}

export interface CashSessionIdPayload {
  idBusiness: number;
  idCashSession: number;
}

export interface CashSessionListFilters {
  idBusiness: number;
  page: number;
  limit: number;
  offset: number;
  idCashRegister?: number | null;
  idUser?: number | null;
  status?: CashSessionStatus | null;
  startDate?: Date | null;
  endDate?: Date | null;
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

export interface TotalRecordsDbRow {
  totalRecords: number;
}
