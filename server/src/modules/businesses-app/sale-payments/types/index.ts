import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type SalePaymentStatus = "PENDING" | "COLLECTED" | "CONFIRMED" | "CANCELLED";

export type SalePaymentEventType =
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_METHOD_CHANGED"
  | "PAYMENT_COLLECTED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_CANCELLED";

export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface SalePaymentDbRow {
  idSalePayment: number;
  idBusiness: number;
  idSale: number;
  sale_number?: string;
  idPaymentMethod: number;
  payment_method_code: string;
  payment_method_name: string;
  affects_cash: number;
  amount: string | number;
  status: SalePaymentStatus;
  created_by_user_id?: number;
  created_by_user_name?: string | null;
  collected_by_user_id?: number | null;
  collected_by_user_name?: string | null;
  confirmed_by_user_id?: number | null;
  confirmed_by_user_name?: string | null;
  cancelled_by_user_id?: number | null;
  cancelled_by_user_name?: string | null;
  idCashSession: number | null;
  idCashSettlement: number | null;
  cancellation_reason?: string | null;
  reference: string | null;
  observation: string | null;
  created_at: Date;
  updated_at?: Date | null;
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

export interface CollectPaymentMethodResponse {
  idPaymentMethod: number;
  code: string;
  name: string;
  affectsCash: boolean;
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

export interface SalePaymentAccessFilters {
  idBusiness: number;
  idUser: number;
  actorCanViewAll: boolean;
}

export interface SalePaymentEventDbRow {
  idSalePaymentEvent: number;
  idBusiness: number;
  idSalePayment: number;
  event_type: SalePaymentEventType;
  previous_status: SalePaymentStatus | null;
  new_status: SalePaymentStatus | null;
  metadata: string | Buffer | JsonValue | null;
  created_by_user_id: number | null;
  created_by_user_name: string | null;
  created_at: Date;
}

export interface SalePaymentEventResponse {
  idSalePaymentEvent: number;
  idBusiness: number;
  idSalePayment: number;
  eventType: SalePaymentEventType;
  previousStatus: SalePaymentStatus | null;
  newStatus: SalePaymentStatus | null;
  metadata: JsonValue | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  createdAt: Date;
}

export interface SalePaymentAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
