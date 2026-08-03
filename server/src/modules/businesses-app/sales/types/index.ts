import type { Request } from "express";
import type { BusinessRequestUser } from "@/types/auth.types.js";

export type SaleStatus = "COMPLETED" | "CANCELLED";
export type ProductUnitType = "UNIT" | "KG" | "GRAM" | "LITER" | "METER";

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
  sale_date: Date;
  subtotal: string | number;
  discount_total: string | number;
  total: string | number;
  payment_detail: string | null;
  status: SaleStatus;
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

export interface CreateSaleDetailPayload {
  idProduct: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface CreateSalePayload {
  idBusiness: number;
  idUser: number;
  idCustomer?: number | null;
  idDeposit: number;
  idCashSession: number;
  idPaymentMethod?: number | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  observation?: string | null;
  items: CreateSaleDetailPayload[];
}

export interface CreateSaleProcedurePayload extends CreateSalePayload {
  saleNumber: string;
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
}

export interface SaleAuthenticatedRequest extends Request {
  user: BusinessRequestUser;
}
