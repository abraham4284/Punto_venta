import type { OrderDbRow, OrderDetailDbRow, OrderEventDbRow, OrderProductDbRow, CustomerSnapshot } from "../types/index.js";

export function mapOrder(row: OrderDbRow) {
  const customerSnapshot: CustomerSnapshot = typeof row.customer_snapshot === "string"
    ? JSON.parse(row.customer_snapshot) as CustomerSnapshot : row.customer_snapshot;
  return {
    idOrder: Number(row.idOrder), idBusiness: Number(row.idBusiness), orderNumber: row.order_number,
    idCustomer: Number(row.idCustomer), idDeposit: Number(row.idDeposit),
    expectedPaymentMethodId: row.expected_payment_method_id == null ? null : Number(row.expected_payment_method_id),
    status: row.status, fulfillmentType: row.fulfillment_type, customerSnapshot,
    delivery: row.fulfillment_type === "DELIVERY" ? {
      recipientName: row.delivery_recipient_name, recipientPhone: row.delivery_recipient_phone,
      address: row.delivery_address, reference: row.delivery_reference,
    } : null,
    subtotal: Number(row.subtotal), discountTotal: Number(row.discount_total), deliveryFee: Number(row.delivery_fee), total: Number(row.total),
    observation: row.observation, cancellationReason: row.cancellation_reason,
    createdByUserId: Number(row.created_by_user_id), updatedByUserId: Number(row.updated_by_user_id),
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
export function mapOrderDetail(row: OrderDetailDbRow) {
  return {
    idOrderDetail: Number(row.idOrderDetail), idOrder: Number(row.idOrder), idProduct: Number(row.idProduct),
    productName: row.product_name, barcode: row.barcode, unitType: row.unit_type,
    saleMode: row.sale_mode === "ON_ORDER" ? "on_order" : "stock",
    quantity: Number(row.quantity), unitPrice: Number(row.unit_price), discount: Number(row.discount), total: Number(row.total),
  };
}
export function mapOrderEvent(row: OrderEventDbRow) {
  return {
    idOrderEvent: Number(row.idOrderEvent), idOrder: Number(row.idOrder), eventType: row.event_type,
    fromStatus: row.from_status, toStatus: row.to_status, idUser: Number(row.idUser),
    reason: row.reason, createdAt: row.created_at,
  };
}
export function mapOrderProduct(row: OrderProductDbRow) {
  return {
    idProduct: Number(row.idProduct), name: row.name, barcode: row.barcode, unitType: row.unit_type,
    saleMode: row.sale_mode === "ON_ORDER" ? "on_order" : "stock",
    priceSale: Number(row.price_sale), stockQuantity: Number(row.stock_quantity),
  };
}
