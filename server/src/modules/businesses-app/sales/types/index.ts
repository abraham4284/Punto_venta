import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type SaleStatus = "COMPLETED" | "CANCELLED";
export type ProductUnitType = "UNIT" | "KG" | "GRAM" | "LITER" | "METER";
export type SalePaymentStatus = "PENDING" | "COLLECTED" | "CONFIRMED" | "CANCELLED";
export type SaleDeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export interface SaleDbRow {
  idSale: number;
  sale_number: string | null;
  idBusiness: number;
  idUser: number;
  user_name: string;
  idCustomer: number | null;
  customer_name: string | null;
  idDeposit: number;
  deposit_name: string;
  idCashSession: number;
  idPaymentMethod: number | null;
  payment_method_name: string | null;
  payment_method_code: string | null;
  confirmed_amount: string | number;
  collected_amount: string | number;
  pending_amount: string | number;
  delivery_status: SaleDeliveryStatus | null;
  payment_status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  sale_date: Date;
  subtotal: string | number;
  discount_total: string | number;
  total: string | number;
  payment_detail: string | null;
  status: SaleStatus;
  idempotency_key?: string;
  observation: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface SaleDetailDbRow {
  idSaleDetail: number;
  idSale: number;
  idBusiness: number;
  idProduct: number;
  product_name: string;
  barcode: string | null;
  product_image_url: string | null;
  idDeposit: number;
  deposit_name: string;
  quantity: string | number;
  unit_price: string | number;
  discount: string | number;
  total: string | number;
  created_at: Date;
}

export interface ProductWithStockDbRow {
  idProduct: number;
  idBusiness: number;
  idProductCategory: number;
  category_name: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cost: string | number;
  price_sale: string | number;
  price_wholesale: string | number | null;
  unit_type: ProductUnitType | null;
  stock_min: string | number;
  is_active: number;
  stock_quantity: string | number;
}

export interface DeliveryUserOptionDbRow {
  idUser: number;
  name: string;
  username: string;
}

export interface DeliveryUserOption {
  idUser: number;
  name: string;
  username: string;
}

export interface CreateSaleDetailPayload {
  idProduct: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface CreateSalePaymentPayload {
  idPaymentMethod: number;
  amount: number;
  status: "PENDING" | "CONFIRMED";
  reference?: string | null;
  observation?: string | null;
}

export interface CreateSaleDeliveryPayload {
  assignedToUserId?: number | null;
  recipientName: string;
  recipientPhone?: string | null;
  deliveryAddress: string;
  deliveryReference?: string | null;
  scheduledAt?: Date | null;
  observation?: string | null;
}

export interface CreateSalePayload {
  idBusiness: number;
  idUser: number;
  idCustomer?: number | null;
  idDeposit: number;
  idCashSession: number;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation?: string | null;
  idempotencyKey: string;
  payments: CreateSalePaymentPayload[];
  delivery?: CreateSaleDeliveryPayload | null;
  items: CreateSaleDetailPayload[];
}

export interface CreateSaleProcedurePayload extends CreateSalePayload {
  saleNumber: string;
}

export interface CreateSaleServiceResponse {
  sale: SaleWithDetailsResponse;
  idempotentReplay: boolean;
}

export interface CancelSalePayload {
  idBusiness: number;
  idSale: number;
}

export interface GetSalesFilters {
  idBusiness: number;
  page: number;
  limit: number;
  offset: number;
  idDeposit?: number | null;
  idPaymentMethod?: number | null;
  status?: SaleStatus | null;
  saleNumberSearch?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface SalesPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface PaginatedSalesResponse {
  sales: SaleResponse[];
  pagination: SalesPagination;
  metrics: SalesSummary;
}

export interface TotalRecordsDbRow {
  totalRecords: number;
  completedRecords: number;
  cancelledRecords: number;
  completedTotal: string | number;
}

export interface SalesSummary {
  total: number;
  completed: number;
  completedPercentage: number;
  cancelled: number;
  cancelledPercentage: number;
  completedTotal: number;
}

export interface SaleResponse {
  idSale: number;
  saleNumber: string;
  idBusiness: number;
  idUser: number;
  userName: string;
  idCustomer: number | null;
  customerName: string | null;
  idDeposit: number;
  depositName: string;
  idCashSession: number;
  idPaymentMethod: number | null;
  paymentMethodName: string | null;
  paymentMethodCode: string | null;
  confirmedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  deliveryStatus: SaleDeliveryStatus | null;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  saleDate: Date;
  subtotal: number;
  discountTotal: number;
  total: number;
  paymentDetail: string | null;
  status: SaleStatus;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SalePaymentDbRow {
  idSalePayment: number;
  idBusiness: number;
  idSale: number;
  idPaymentMethod: number;
  payment_method_code: string;
  payment_method_name: string;
  affects_cash: number;
  amount: string | number;
  status: SalePaymentStatus;
  idCashSession: number | null;
  idCashSettlement: number | null;
  reference: string | null;
  observation: string | null;
  created_at: Date;
  collected_at: Date | null;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
}

export interface SalePaymentResponse {
  idSalePayment: number;
  idBusiness: number;
  idSale: number;
  idPaymentMethod: number;
  paymentMethodCode: string;
  paymentMethodName: string;
  affectsCash: boolean;
  amount: number;
  status: SalePaymentStatus;
  idCashSession: number | null;
  idCashSettlement: number | null;
  reference: string | null;
  observation: string | null;
  createdAt: Date;
  collectedAt: Date | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
}

export interface SaleDeliveryDbRow {
  idSaleDelivery: number;
  idBusiness: number;
  idSale: number;
  assigned_to_user_id: number | null;
  assigned_user_name: string | null;
  status: SaleDeliveryStatus;
  recipient_name: string;
  recipient_phone: string | null;
  delivery_address: string;
  delivery_reference: string | null;
  scheduled_at: Date | null;
  assigned_at: Date | null;
  out_for_delivery_at: Date | null;
  delivered_at: Date | null;
  failed_at: Date | null;
  cancelled_at: Date | null;
  failure_reason: string | null;
  observation: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SaleDeliveryResponse {
  idSaleDelivery: number;
  idBusiness: number;
  idSale: number;
  assignedToUserId: number | null;
  assignedUserName: string | null;
  status: SaleDeliveryStatus;
  recipientName: string;
  recipientPhone: string | null;
  deliveryAddress: string;
  deliveryReference: string | null;
  scheduledAt: Date | null;
  assignedAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  failureReason: string | null;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleDetailResponse {
  idSaleDetail: number;
  idSale: number;
  idBusiness: number;
  idProduct: number;
  productName: string;
  barcode: string | null;
  productImageUrl: string | null;
  idDeposit: number;
  depositName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  createdAt: Date;
}

export interface SaleWithDetailsResponse extends SaleResponse {
  items: SaleDetailResponse[];
  payments: SalePaymentResponse[];
  delivery: SaleDeliveryResponse | null;
}

export interface ProductWithStockResponse {
  idProduct: number;
  idBusiness: number;
  idProductCategory: number;
  categoryName: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCost: number;
  priceSale: number;
  priceWholesale: number | null;
  unitType: ProductUnitType;
  stockMin: number;
  isActive: boolean;
  stockQuantity: number;
}

export interface SaleIdDbRow {
  idSale: number;
  saleNumber: string;
  alreadyProcessed: number;
}

export interface SaleAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
