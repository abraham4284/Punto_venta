export interface SaleRow {
    idSale: number;
    idDeposit: number;
    sale_number: string;
    total: string;
    delivery_fee: string;
    status: string;
}
export interface ItemRow {
    idSaleDetail: number;
    idProduct: number;
    quantity: string;
    subtotal: string;
    unit_type: string;
    productName: string;
    barcode: string | null;
    returnedQuantity: string;
    returnedAmount: string;
}
export interface PaymentRow {
    idSalePayment: number;
    idPaymentMethod: number;
    amount: string;
    status: string;
    affects_cash: number;
    paymentMethodName: string;
    refundedAmount: string;
    idCashSettlement: number | null;
}
export interface DeliveryRow {
    idSaleDelivery: number;
    status: string;
}
export interface ReturnRow {
    idSaleReturn: number;
    idSale: number;
    request_hash: string;
    return_number: string;
    sale_number: string;
    merchandise_amount: string;
    delivery_fee_refund: string;
    total_refund: string;
    reason: string;
    observation: string | null;
    created_by_user_id: number;
    createdByName: string;
    created_at: Date;
}
export interface ReturnContext {
    sale: SaleRow;
    items: ItemRow[];
    payments: PaymentRow[];
    delivery: DeliveryRow | null;
    deliveryRefunded: string;
}
