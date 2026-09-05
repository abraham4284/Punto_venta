export type PriceType = "SALE" | "WHOLESALE";
export type ProductUnitType = "UNIT" | "KG" | "GRAM" | "LITER" | "METER";

export const PRODUCT_UNIT_TYPE_OPTIONS: {
  value: ProductUnitType;
  label: string;
  shortLabel: string;
}[] = [
  { value: "UNIT", label: "Unidad", shortLabel: "u." },
  { value: "KG", label: "Kilogramo", shortLabel: "kg" },
  { value: "GRAM", label: "Gramo", shortLabel: "g" },
  { value: "LITER", label: "Litro", shortLabel: "l" },
  { value: "METER", label: "Metro", shortLabel: "m" },
];

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  status: boolean;
  message: string;
  errors?: FieldError[];
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaymentMethodOption {
  idPaymentMethod: number;
  code: "CASH" | "TRANSFER" | "CARD" | "OTHER";
  name: string;
  affectsCash: boolean;
  isDefault: boolean;
  isActive: boolean;
}

export interface DeliveryUserOption {
  idUser: number;
  name: string;
  username: string;
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

export interface SaleHeaderInput {
  idCustomer: number | null;
  idDeposit: number | null;
  idCashSession: number | null;
  idPaymentMethod: number | null;
  saleDate: Date;
  subtotal: number;
  discountPercent: number;
  discountTotal: number;
  total: number;
  observation: string;
  status: "COMPLETED" | "CANCELLED";
}

export interface SaleDeliveryInput {
  enabled: boolean;
  assignedToUserId: number | null;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryReference: string;
  scheduledAt: string;
  observation: string;
}

export interface SalePaymentInput {
  id: string;
  idPaymentMethod: number | null;
  amount: string;
  status: "PENDING" | "CONFIRMED";
  reference: string;
  observation: string;
}

export interface SaleDetailInput {
  idProduct: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface CartItem {
  idProduct: number;
  name: string;
  barcode: string | null;
  imageUrl: string | null;
  stockQuantity: number;
  priceSale: number;
  priceWholesale: number | null;
  unitType: ProductUnitType;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  subtotalBeforeDiscount: number;
  total: number;
}

export interface ProductSelection {
  product: ProductWithStockResponse;
  quantity: number;
}

export interface CreateSalePayload {
  idCustomer: number | null;
  idDeposit: number;
  idCashSession: number;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation: string | null;
  payments: {
    idPaymentMethod: number;
    amount: number;
    status: "PENDING" | "CONFIRMED";
    reference?: string | null;
    observation?: string | null;
  }[];
  delivery?: {
    assignedToUserId?: number | null;
    recipientName: string;
    recipientPhone?: string | null;
    deliveryAddress: string;
    deliveryReference?: string | null;
    scheduledAt?: string | null;
    observation?: string | null;
  } | null;
  items: SaleDetailInput[];
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
  status: "COMPLETED" | "CANCELLED";
  observation: string | null;
  createdAt: Date;
  updatedAt: Date | null;
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

export type SalePaymentStatus = "PENDING" | "COLLECTED" | "CONFIRMED" | "CANCELLED";
export type SaleDeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

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

export interface SaleWithDetailsResponse extends SaleResponse {
  items: SaleDetailResponse[];
  payments: SalePaymentResponse[];
  delivery: SaleDeliveryResponse | null;
}

export interface SaleTicketItem {
  idSaleDetail: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleTicketHeader {
  idSale: number;
  saleNumber: string;
  idBusiness: number;
  businessName: string;
  businessType: string | null;
  logoUrl: string | null;
  saleDate: Date;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation: string | null;
  status: "COMPLETED" | "CANCELLED";
  customerName: string;
  userName: string;
  depositName: string;
  paymentMethodCode: string | null;
  paymentMethodName: string;
}

export interface SaleTicketResponse {
  idSale: number;
  saleNumber: string;
  sale: SaleTicketHeader;
  items: SaleTicketItem[];
  htmlTemplate: string;
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
  metrics: SaleMetricsData;
}

export interface SaleFilters {
  saleNumber: string;
  idDeposit: number | null;
  idPaymentMethod: number | null;
  status: "COMPLETED" | "CANCELLED" | null;
  startDate: string;
  endDate: string;
}

export interface SaleMetricsData {
  total: number;
  completed: number;
  completedPercentage: number;
  cancelled: number;
  cancelledPercentage: number;
  completedTotal: number;
}
