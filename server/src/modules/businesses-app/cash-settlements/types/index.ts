import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export interface CashSettlementDbRow {
  idCashSettlement: number;
  idBusiness: number;
  collector_user_id: number;
  collector_user_name: string;
  received_by_user_id: number;
  received_by_user_name: string;
  idCashSession: number;
  total_amount: string | number;
  observation: string | null;
  settled_at: Date;
  created_at: Date;
}

export interface CashSettlementPaymentDbRow {
  idSalePayment: number;
  idSale: number;
  sale_number: string;
  idPaymentMethod: number;
  payment_method_name: string;
  amount: string | number;
  status: string;
  collected_at: Date | null;
  confirmed_at: Date | null;
  reference: string | null;
  observation: string | null;
}

export interface CashSettlementPaymentResponse {
  idSalePayment: number;
  idSale: number;
  saleNumber: string;
  idPaymentMethod: number;
  paymentMethodName: string;
  amount: number;
  status: string;
  collectedAt: Date | null;
  confirmedAt: Date | null;
  reference: string | null;
  observation: string | null;
}

export interface CashSettlementResponse {
  idCashSettlement: number;
  idBusiness: number;
  collectorUserId: number;
  collectorUserName: string;
  receivedByUserId: number;
  receivedByUserName: string;
  idCashSession: number;
  totalAmount: number;
  observation: string | null;
  settledAt: Date;
  createdAt: Date;
}

export interface CashSettlementWithPaymentsResponse extends CashSettlementResponse {
  payments: CashSettlementPaymentResponse[];
}

export interface CreateCashSettlementPayload {
  idBusiness: number;
  collectorUserId: number;
  receivedByUserId: number;
  idCashSession: number;
  observation?: string | null;
}

export interface CashSettlementListFilters {
  idBusiness: number;
  page: number;
  limit: number;
  offset: number;
  collectorUserId?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface PaginatedCashSettlementsResponse {
  settlements: CashSettlementResponse[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

export interface TotalRecordsDbRow {
  totalRecords: number;
}

export interface CashSettlementAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
