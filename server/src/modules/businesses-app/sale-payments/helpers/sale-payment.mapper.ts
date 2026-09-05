import type {
  SalePaymentDbRow,
  SalePaymentResponse,
} from "../types/index.js";

export function mapSalePayment(row: SalePaymentDbRow): SalePaymentResponse {
  return {
    idSalePayment: row.idSalePayment,
    idBusiness: row.idBusiness,
    idSale: row.idSale,
    idPaymentMethod: row.idPaymentMethod,
    paymentMethodCode: row.payment_method_code,
    paymentMethodName: row.payment_method_name,
    affectsCash: Boolean(row.affects_cash),
    amount: Number(row.amount),
    status: row.status,
    idCashSession: row.idCashSession,
    idCashSettlement: row.idCashSettlement,
    reference: row.reference,
    observation: row.observation,
    createdAt: row.created_at,
    collectedAt: row.collected_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
  };
}
