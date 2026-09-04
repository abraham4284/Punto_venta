export type CashSettlementResponse = {
  idCashSettlement: number;
  idBusiness: number;
  collectorUserId: number;
  collectorUserName: string;
  receivedByUserId: number;
  receivedByUserName: string;
  idCashSession: number;
  totalAmount: number;
  observation: string | null;
  settledAt: string;
  createdAt: string;
};

export type CashSettlementPaymentResponse = {
  idSalePayment: number;
  idSale: number;
  saleNumber: string;
  idPaymentMethod: number;
  paymentMethodName: string;
  amount: number;
  status: string;
  collectedAt: string | null;
  confirmedAt: string | null;
  reference: string | null;
  observation: string | null;
};

export type CashSettlementWithPaymentsResponse = CashSettlementResponse & {
  payments: CashSettlementPaymentResponse[];
};

export type CashSettlementFilters = {
  collectorUserId: number | null;
  startDate: string;
  endDate: string;
};

export type CashSettlementPagination = {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export type PaginatedCashSettlementsResponse = {
  settlements: CashSettlementResponse[];
  pagination: CashSettlementPagination;
};

export type CreateCashSettlementBody = {
  collectorUserId: number;
  idCashSession: number;
  observation?: string | null;
};
