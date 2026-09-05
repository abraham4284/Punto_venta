export type SalePaymentStatus = "PENDING" | "COLLECTED" | "CONFIRMED" | "CANCELLED";

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
