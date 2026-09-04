import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type SalePaymentStatus = "PENDING" | "COLLECTED" | "CONFIRMED" | "CANCELLED";

export interface SalePaymentDbRow {
  idSalePayment: number;
  idBusiness: number;
  idSale: number;
  idPaymentMethod: number;
  payment_method_code: string;
  payment_method_name: string;
  affects_cash: number;
  amount: string | number;
  status: SalePaymentStatus;
  idCashSession: number | null;
  idCashSettlement: number | null;
  reference: string | null;
  observation: string | null;
  created_at: Date;
  collected_at: Date | null;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
}

export interface SalePaymentResponse {
  idSalePayment: number;
  idBusiness: number;
  idSale: number;
  idPaymentMethod: number;
  paymentMethodCode: string;
  paymentMethodName: string;
  affectsCash: boolean;
  amount: number;
  status: SalePaymentStatus;
  idCashSession: number | null;
  idCashSettlement: number | null;
  reference: string | null;
  observation: string | null;
  createdAt: Date;
  collectedAt: Date | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
}

export interface CreateSalePaymentPayload {
  idBusiness: number;
  idSale: number;
  idPaymentMethod: number;
  amount: number;
  status: "PENDING" | "CONFIRMED";
  idUser: number;
  idCashSession?: number | null;
  reference?: string | null;
  observation?: string | null;
}

export interface UpdateSalePaymentPayload {
  idBusiness: number;
  idSalePayment: number;
  idPaymentMethod: number;
  amount: number;
  idUser: number;
  reference?: string | null;
  observation?: string | null;
}

export interface SalePaymentActionPayload {
  idBusiness: number;
  idSalePayment: number;
  idUser: number;
  idCashSession?: number | null;
  idPaymentMethod?: number | null;
  reason?: string | null;
  observation?: string | null;
}

export interface SalePaymentAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
