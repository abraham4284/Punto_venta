export type ReturnStatus = "NONE" | "PARTIAL" | "FULL";
export type RefundStatus = ReturnStatus;
export interface SaleReturnSummary {
  returnStatus: ReturnStatus; refundStatus: RefundStatus;
  returnedMerchandiseAmount: number; refundedDeliveryFee: number; refundedTotal: number; netSaleAmount: number;
}
export interface ReturnableItem {
  idSaleDetail: number;
  product: { idProduct: number; productName: string; barcode: string | null; unitType: string };
  soldQuantity: number; returnedQuantity: number; remainingQuantity: number; remainingRefundAmount: number;
}
export interface RefundablePayment {
  idSalePayment: number; paymentMethod: { idPaymentMethod: number; name: string };
  amount: number; alreadyRefunded: number; remainingRefundable: number; affectsCash: boolean;
  status: "PENDING" | "COLLECTED" | "CONFIRMED" | "CANCELLED";
}
export interface SaleReturn {
  idSaleReturn: number; idSale: number; returnNumber: string; saleNumber: string;
  reason: string; observation: string | null; merchandiseAmount: number; deliveryFeeRefund: number; totalRefund: number;
  createdBy: { idUser: number; name: string }; createdAt: string;
  items: Array<{ idSaleReturnItem: number; idSaleDetail: number; idProduct: number; productName: string; barcode: string | null; quantity: number; refundAmount: number; restock: boolean }>;
  refunds: Array<{ idSaleRefund: number; idSalePayment: number; paymentMethodName: string; affectsCash: boolean; amount: number; idCashSession: number | null; cashMovement: { idCashMovement: number; movementType: "EXPENSE"; category: "SALE_REFUND" } | null; reference: string | null; observation: string | null }>;
}
export interface SaleReturnsData {
  returns: SaleReturn[]; summary: SaleReturnSummary; returnableItems: ReturnableItem[];
  refundablePayments: RefundablePayment[]; remainingDeliveryFeeRefund: number;
}
export interface SaleReturnPayload {
  reason: string; observation: string | null; deliveryFeeRefund: number;
  items: Array<{ idSaleDetail: number; quantity: number; restock: boolean }>;
  refunds: Array<{ idSalePayment: number; amount: number; reference: string | null; observation: string | null }>;
  idCashSession: number | null;
}
export interface SaleReturnResult { saleReturn: SaleReturn; summary: SaleReturnSummary; idempotentReplay: boolean }
export interface SaleReturnDraft {
  reason: string; observation: string; deliveryFeeRefund: string; manualRefunds: boolean;
  items: Array<{ idSaleDetail: number; selected: boolean; quantity: string; restock: boolean }>;
  refunds: Array<{ idSalePayment: number; amount: string; reference: string; observation: string }>;
}
export interface ReturnRequestFailure { status?: number; code?: string; message: string; errors: Array<{ field: string; message: string }> }
