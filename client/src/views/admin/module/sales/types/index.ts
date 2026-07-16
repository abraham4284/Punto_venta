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
  name: string;
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
  idPaymentMethod: number | null;
  saleDate: Date;
  subtotal: number;
  discountPercent: number;
  discountTotal: number;
  total: number;
  observation: string;
  status: "COMPLETED" | "CANCELLED";
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
  idPaymentMethod: number | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation: string | null;
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
  idPaymentMethod: number | null;
  paymentMethodName: string | null;
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

export interface SaleWithDetailsResponse extends SaleResponse {
  items: SaleDetailResponse[];
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
