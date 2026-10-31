import type { RowDataPacket } from "mysql2";
import type { z } from "zod";
import type {
  orderFiltersSchema,
  orderProductsQuerySchema,
} from "../validations/orders.validations.js";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";
export type UnitType = "UNIT" | "KG" | "GRAM" | "LITER" | "METER";
export interface OrderItem {
  idProduct: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}
export interface OrderBody {
  idCustomer: number;
  idDeposit: number;
  expectedPaymentMethodId?: number | null;
  fulfillmentType: "PICKUP" | "DELIVERY";
  delivery?: {
    recipientName: string;
    recipientPhone: string;
    address: string;
    reference?: string | null;
  } | null;
  observation?: string | null;
  deliveryFee: number;
  subtotal: number;
  discountTotal: number;
  total: number;
  items: OrderItem[];
}
export type OrderFilters = z.infer<typeof orderFiltersSchema>;
export type OrderProductsQuery = z.infer<typeof orderProductsQuerySchema>;
export interface OrderActor {
  idBusiness: number;
  idUser: number;
}
export interface CustomerSnapshot {
  fullName: string;
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}
export interface OrderDbRow extends RowDataPacket {
  idOrder: number;
  idBusiness: number;
  idCustomer: number;
  idDeposit: number;
  expected_payment_method_id: number | null;
  order_number: string;
  status: OrderStatus;
  fulfillment_type: "PICKUP" | "DELIVERY";
  customer_snapshot: string | CustomerSnapshot;
  delivery_recipient_name: string | null;
  delivery_recipient_phone: string | null;
  delivery_address: string | null;
  delivery_reference: string | null;
  subtotal: string | number;
  discount_total: string | number;
  delivery_fee: string | number;
  total: string | number;
  observation: string | null;
  cancellation_reason: string | null;
  created_by_user_id: number;
  updated_by_user_id: number;
  created_at: Date;
  updated_at: Date;
}
export interface OrderDetailDbRow extends RowDataPacket {
  product_image_url: string | null;
  idOrderDetail: number;
  idOrder: number;
  idProduct: number;
  product_name: string;
  barcode: string | null;
  unit_type: UnitType;
  sale_mode: "STOCK" | "ON_ORDER";
  quantity: string | number;
  unit_price: string | number;
  discount: string | number;
  total: string | number;
}
export interface OrderEventDbRow extends RowDataPacket {
  idOrderEvent: number;
  idOrder: number;
  event_type: "CREATED" | "UPDATED" | "STATUS_CHANGED" | "CANCELLED";
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  idUser: number;
  reason: string | null;
  created_at: Date;
}
export interface OrderProductDbRow extends RowDataPacket {
  image_url: string | null;
  idProduct: number;
  name: string;
  barcode: string | null;
  unit_type: UnitType;
  sale_mode: "STOCK" | "ON_ORDER";
  price_sale: string | number;
  stock_quantity: string | number;
}
export interface CustomerSnapshotRow extends RowDataPacket {
  first_name: string;
  last_name: string;
  document_type: string | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface OrderLinkedSaleDbRow extends RowDataPacket {
  idSale: number;
  sale_number: string;
  status: "COMPLETED" | "CANCELLED";
}
