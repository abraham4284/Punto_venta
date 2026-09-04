import type {
  CashSettlementDbRow,
  CashSettlementPaymentDbRow,
  CashSettlementPaymentResponse,
  CashSettlementResponse,
} from "../types/index.js";

export function mapCashSettlement(row: CashSettlementDbRow): CashSettlementResponse {
  return {
    idCashSettlement: row.idCashSettlement,
    idBusiness: row.idBusiness,
    collectorUserId: row.collector_user_id,
    collectorUserName: row.collector_user_name,
    receivedByUserId: row.received_by_user_id,
    receivedByUserName: row.received_by_user_name,
    idCashSession: row.idCashSession,
    totalAmount: Number(row.total_amount),
    observation: row.observation,
    settledAt: row.settled_at,
    createdAt: row.created_at,
  };
}

export function mapCashSettlementPayment(
  row: CashSettlementPaymentDbRow,
): CashSettlementPaymentResponse {
  return {
    idSalePayment: row.idSalePayment,
    idSale: row.idSale,
    saleNumber: row.sale_number,
    idPaymentMethod: row.idPaymentMethod,
    paymentMethodName: row.payment_method_name,
    amount: Number(row.amount),
    status: row.status,
    collectedAt: row.collected_at,
    confirmedAt: row.confirmed_at,
    reference: row.reference,
    observation: row.observation,
  };
}
