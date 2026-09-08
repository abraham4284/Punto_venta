export type SalePaymentStatus = "PENDING" | "COLLECTED" | "CONFIRMED" | "CANCELLED";

export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SalePaymentEventType =
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_METHOD_CHANGED"
  | "PAYMENT_COLLECTED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_SETTLED"
  | "PAYMENT_MIGRATED";

export type SalePaymentResponse = {
  idSalePayment: number;
  idBusiness: number;
  idSale: number;
  idPaymentMethod: number;
  paymentMethodCode: "CASH" | "TRANSFER" | "CARD" | "OTHER";
  paymentMethodName: string;
  affectsCash: boolean;
  amount: number;
  status: SalePaymentStatus;
  idCashSession: number | null;
  idCashSettlement: number | null;
  reference: string | null;
  observation: string | null;
  createdAt: string;
  collectedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

export type CreateSalePaymentBody = {
  idPaymentMethod: number;
  amount: number;
  status: "PENDING" | "CONFIRMED";
  idCashSession?: number | null;
  reference?: string | null;
  observation?: string | null;
};

export type UpdateSalePaymentBody = {
  idPaymentMethod: number;
  amount: number;
  reference?: string | null;
  observation?: string | null;
};

export type SalePaymentActionBody = {
  idPaymentMethod?: number | null;
  idCashSession?: number | null;
  reason?: string | null;
  observation?: string | null;
};

export type CollectPaymentMethodResponse = {
  idPaymentMethod: number;
  code: "CASH" | "TRANSFER" | "CARD" | "OTHER" | string;
  name: string;
  affectsCash: boolean;
};

export type SalePaymentEventResponse = {
  idSalePaymentEvent: number;
  idBusiness: number;
  idSalePayment: number;
  eventType: SalePaymentEventType;
  previousStatus: SalePaymentStatus | null;
  newStatus: SalePaymentStatus | null;
  metadata: JsonValue | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  createdAt: string;
};
