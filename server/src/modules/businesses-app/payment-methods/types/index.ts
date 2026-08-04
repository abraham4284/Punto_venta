export type PaymentMethodCode = "CASH" | "TRANSFER" | "CARD" | "OTHER";

export interface PaymentMethodDbRow {
  idPaymentMethod: number;
  idBusiness: number;
  code: PaymentMethodCode;
  name: string;
  affects_cash: number;
  is_default: number;
  is_active: number;
  created_at: Date;
  sales_count: number;
}

export interface PaymentMethodResponse {
  idPaymentMethod: number;
  idBusiness: number;
  code: PaymentMethodCode;
  name: string;
  affectsCash: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  salesCount: number;
}

export interface PaymentMethodIdPayload {
  idBusiness: number;
  idPaymentMethod: number;
}

export interface ListPaymentMethodsPayload {
  idBusiness: number;
  onlyActive: boolean;
}

export interface CreatePaymentMethodPayload {
  idBusiness: number;
  idUser: number;
  code: Exclude<PaymentMethodCode, "CASH">;
  name: string;
}

export interface UpdatePaymentMethodPayload extends PaymentMethodIdPayload {
  name: string;
}

export interface ChangePaymentMethodStatusPayload extends PaymentMethodIdPayload {
  isActive: boolean;
}
