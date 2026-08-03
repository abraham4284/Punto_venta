import type {
  CashLiveSummaryDbRow,
  CashLiveSummaryResponse,
  CashPaymentSummaryDbRow,
  CashSessionDbRow,
  CashSessionPaymentSummaryResponse,
  CashSessionResponse,
} from "../types/index.js";

function nullableNumber(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

export function mapCashSession(row: CashSessionDbRow): CashSessionResponse {
  return {
    idCashSession: row.idCashSession,
    idBusiness: row.idBusiness,
    idCashRegister: row.idCashRegister,
    cashRegisterName: row.cashRegisterName,
    cashRegisterIsDefault: Boolean(row.cashRegisterIsDefault),
    openedByUserId: row.opened_by_user_id,
    openedByUserName: row.openedByUserName,
    closedByUserId: row.closed_by_user_id,
    closedByUserName: row.closedByUserName,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    openingAmount: Number(row.opening_amount),
    expectedCashAmount: nullableNumber(row.expected_cash_amount),
    countedCashAmount: nullableNumber(row.counted_cash_amount),
    differenceAmount: nullableNumber(row.difference_amount),
    openingObservation: row.opening_observation,
    closingObservation: row.closing_observation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCashPaymentSummary(
  row: CashPaymentSummaryDbRow,
): CashSessionPaymentSummaryResponse {
  return {
    idPaymentMethod: row.idPaymentMethod,
    paymentMethodCode: row.paymentMethodCode,
    paymentMethodName: row.paymentMethodName,
    affectsCash: Boolean(row.affectsCash),
    salesCount: Number(row.salesCount),
    totalAmount: Number(row.totalAmount),
  };
}

export function mapCashLiveSummary(
  row: CashLiveSummaryDbRow,
  paymentSummaries: CashPaymentSummaryDbRow[],
): CashLiveSummaryResponse {
  return {
    idCashSession: row.idCashSession,
    idBusiness: row.idBusiness,
    idCashRegister: row.idCashRegister,
    cashRegisterName: row.cashRegisterName,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    openingAmount: Number(row.openingAmount),
    cashSales: Number(row.cashSales),
    nonCashSales: Number(row.nonCashSales),
    manualIncome: Number(row.manualIncome),
    manualExpense: Number(row.manualExpense),
    expectedCash: Number(row.expectedCash),
    totalSales: Number(row.totalSales),
    salesCount: Number(row.salesCount),
    cancelledSalesCount: Number(row.cancelledSalesCount),
    summaryByPaymentMethod: paymentSummaries.map(mapCashPaymentSummary),
  };
}
