export type PriceType = "SALE" | "WHOLESALE";

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
  idCustomer: number;
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
