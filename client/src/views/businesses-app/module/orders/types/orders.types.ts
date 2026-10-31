import type { DeliveryProviderPayload } from "../../deliveries/helpers/delivery-provider.helpers";
import type { CreateSalePayload, SaleWithDetailsResponse } from "../../sales/types";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export type OrderFulfillmentType = "PICKUP" | "DELIVERY";
export type OrderUnitType = "UNIT" | "KG" | "GRAM" | "LITER" | "METER";
export interface OrderDelivery { recipientName: string; recipientPhone: string; address: string; reference?: string | null }
export interface CustomerSnapshot {
  fullName: string; documentType: string | null; documentNumber: string | null;
  phone: string | null; email: string | null; address: string | null;
}
export interface OrderItemPayload { idProduct: number; quantity: number; unitPrice: number; discount: number; total: number }
export interface CreateOrderPayload {
  idCustomer: number; idDeposit: number; expectedPaymentMethodId?: number | null;
  fulfillmentType: OrderFulfillmentType; delivery?: OrderDelivery | null;
  deliveryFee: number; subtotal: number; discountTotal: number; total: number;
  observation?: string | null; items: OrderItemPayload[];
}
export type UpdateOrderPayload = CreateOrderPayload;
export interface OrderDetail extends OrderItemPayload {
  productImageUrl: string | null;
  idOrderDetail: number; idOrder: number; productName: string; barcode: string | null;
  unitType: OrderUnitType; saleMode: "stock" | "on_order";
}
export interface OrderLinkedSale { idSale: number; saleNumber: string; status: "COMPLETED" | "CANCELLED" }
export type ConvertOrderPayment = CreateSalePayload["payments"][number];
export interface ConvertOrderPayload {
  idCashSession: number; payments: ConvertOrderPayment[];
  delivery?: DeliveryProviderPayload & Pick<NonNullable<CreateSalePayload["delivery"]>, "scheduledAt" | "observation"> | null;
}
export interface ConvertOrderResult { order: Order; sale: SaleWithDetailsResponse }
export interface Order extends Omit<CreateOrderPayload, "items"> {
  idOrder: number; idBusiness: number; orderNumber: string; status: OrderStatus;
  customerSnapshot: CustomerSnapshot; cancellationReason: string | null;
  createdByUserId: number; updatedByUserId: number; createdAt: string; updatedAt: string;
  linkedSale: OrderLinkedSale | null;
  items: OrderDetail[];
}
export type OrderSummary = Omit<Order, "items" | "linkedSale">;
export interface OrderEvent {
  idOrderEvent: number; idOrder: number; eventType: "CREATED" | "UPDATED" | "STATUS_CHANGED" | "CANCELLED";
  fromStatus: OrderStatus | null; toStatus: OrderStatus; idUser: number; reason: string | null; createdAt: string;
}
export interface OrderProductOption {
  imageUrl: string | null;
  idProduct: number; name: string; barcode: string | null; unitType: OrderUnitType;
  saleMode: "stock" | "on_order"; priceSale: number; stockQuantity: number;
}
export interface OrderPagination { totalRecords: number; currentPage: number; totalPages: number; limit: number }
export interface OrderMetrics { total: number; totalAmount: number; pending: number; confirmed: number; preparing: number; ready: number; completed: number; cancelled: number }
export interface OrderFilters {
  page: number; limit: number; search?: string; status?: OrderStatus; idCustomer?: number; idDeposit?: number;
  fulfillmentType?: OrderFulfillmentType; dateFrom?: string; dateTo?: string;
}
export interface OrderList { orders: OrderSummary[]; pagination: OrderPagination; metrics: OrderMetrics }
export interface OrderProducts { items: OrderProductOption[]; pagination: OrderPagination }
export interface OrdersResponse<T> { status: boolean; message: string; data: T; idempotentReplay?: boolean }
export interface OrderFieldError { field: string; message: string }
export interface OrderRequestError { status?: number; code?: string; message: string; errors: OrderFieldError[] }
export interface OrderDraftLine {
  productImageUrl: string | null;
  idProduct: number; productName: string; barcode: string | null; unitType: OrderUnitType;
  saleMode: "stock" | "on_order"; quantity: string; unitPrice: string; discount: string;
}
export interface OrderDraft {
  idCustomer: string; idDeposit: string; expectedPaymentMethodId: string; fulfillmentType: OrderFulfillmentType;
  recipientName: string; recipientPhone: string; address: string; reference: string; deliveryFee: string; observation: string;
}
