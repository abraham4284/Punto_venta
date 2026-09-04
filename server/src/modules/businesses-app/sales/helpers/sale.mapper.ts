import type {
  ProductWithStockDbRow,
  ProductWithStockResponse,
  ProductUnitType,
  SaleDbRow,
  SaleDetailDbRow,
  SaleDetailResponse,
  SaleDeliveryDbRow,
  SaleDeliveryResponse,
  SalePaymentDbRow,
  SalePaymentResponse,
  SaleResponse,
} from "../types/index.js";

function normalizeUnitType(value: ProductUnitType | null): ProductUnitType {
  return value ?? "UNIT";
}

export function mapSale(sale: SaleDbRow): SaleResponse {
  return {
    idSale: sale.idSale,
    saleNumber: sale.sale_number ?? `#${sale.idSale}`,
    idBusiness: sale.idBusiness,
    idUser: sale.idUser,
    userName: sale.user_name,
    idCustomer: sale.idCustomer,
    customerName: sale.customer_name,
    idDeposit: sale.idDeposit,
    depositName: sale.deposit_name,
    idCashSession: sale.idCashSession,
    idPaymentMethod: sale.idPaymentMethod,
    paymentMethodName: sale.payment_method_name,
    paymentMethodCode: sale.payment_method_code,
    confirmedAmount: Number(sale.confirmed_amount ?? 0),
    collectedAmount: Number(sale.collected_amount ?? 0),
    pendingAmount: Number(sale.pending_amount ?? 0),
    deliveryStatus: sale.delivery_status,
    paymentStatus: sale.payment_status ?? "UNPAID",
    saleDate: sale.sale_date,
    subtotal: Number(sale.subtotal),
    discountTotal: Number(sale.discount_total),
    total: Number(sale.total),
    paymentDetail: sale.payment_detail,
    status: sale.status,
    observation: sale.observation,
    createdAt: sale.created_at,
    updatedAt: sale.updated_at,
  };
}

export function mapSalePayment(payment: SalePaymentDbRow): SalePaymentResponse {
  return {
    idSalePayment: payment.idSalePayment,
    idBusiness: payment.idBusiness,
    idSale: payment.idSale,
    idPaymentMethod: payment.idPaymentMethod,
    paymentMethodCode: payment.payment_method_code,
    paymentMethodName: payment.payment_method_name,
    affectsCash: Boolean(payment.affects_cash),
    amount: Number(payment.amount),
    status: payment.status,
    idCashSession: payment.idCashSession,
    idCashSettlement: payment.idCashSettlement,
    reference: payment.reference,
    observation: payment.observation,
    createdAt: payment.created_at,
    collectedAt: payment.collected_at,
    confirmedAt: payment.confirmed_at,
    cancelledAt: payment.cancelled_at,
  };
}

export function mapSaleDelivery(delivery: SaleDeliveryDbRow): SaleDeliveryResponse {
  return {
    idSaleDelivery: delivery.idSaleDelivery,
    idBusiness: delivery.idBusiness,
    idSale: delivery.idSale,
    assignedToUserId: delivery.assigned_to_user_id,
    assignedUserName: delivery.assigned_user_name,
    status: delivery.status,
    recipientName: delivery.recipient_name,
    recipientPhone: delivery.recipient_phone,
    deliveryAddress: delivery.delivery_address,
    deliveryReference: delivery.delivery_reference,
    scheduledAt: delivery.scheduled_at,
    assignedAt: delivery.assigned_at,
    outForDeliveryAt: delivery.out_for_delivery_at,
    deliveredAt: delivery.delivered_at,
    failedAt: delivery.failed_at,
    cancelledAt: delivery.cancelled_at,
    failureReason: delivery.failure_reason,
    observation: delivery.observation,
    createdAt: delivery.created_at,
    updatedAt: delivery.updated_at,
  };
}

export function mapSaleDetail(detail: SaleDetailDbRow): SaleDetailResponse {
  return {
    idSaleDetail: detail.idSaleDetail,
    idSale: detail.idSale,
    idBusiness: detail.idBusiness,
    idProduct: detail.idProduct,
    productName: detail.product_name,
    barcode: detail.barcode,
    productImageUrl: detail.product_image_url,
    idDeposit: detail.idDeposit,
    depositName: detail.deposit_name,
    quantity: Number(detail.quantity),
    unitPrice: Number(detail.unit_price),
    discount: Number(detail.discount),
    total: Number(detail.total),
    createdAt: detail.created_at,
  };
}

export function mapProductWithStock(
  product: ProductWithStockDbRow,
): ProductWithStockResponse {
  return {
    idProduct: product.idProduct,
    idBusiness: product.idBusiness,
    idProductCategory: product.idProductCategory,
    categoryName: product.category_name,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url,
    priceCost: Number(product.price_cost),
    priceSale: Number(product.price_sale),
    priceWholesale:
      product.price_wholesale === null ? null : Number(product.price_wholesale),
    unitType: normalizeUnitType(product.unit_type),
    stockMin: Number(product.stock_min),
    isActive: Boolean(product.is_active),
    stockQuantity: Number(product.stock_quantity),
  };
}
