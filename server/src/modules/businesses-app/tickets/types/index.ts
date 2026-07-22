export type TicketSaleStatus = "COMPLETED" | "CANCELLED";

export interface TicketSaleDbRow {
  idSale: number;
  sale_number: string | null;
  idBusiness: number;
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
  sale_date: Date;
  subtotal: string | number;
  discount_total: string | number;
  total: string | number;
  observation: string | null;
  status: TicketSaleStatus;
  customer_name: string;
  user_name: string;
  deposit_name: string;
  payment_method_name: string;
}

export interface TicketItemDbRow {
  idSaleDetail: number;
  product_name: string;
  quantity: string | number;
  unit_price: string | number;
  discount: string | number;
  subtotal: string | number;
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
  status: TicketSaleStatus;
  customerName: string;
  userName: string;
  depositName: string;
  paymentMethodName: string;
}

export interface SaleTicketItem {
  idSaleDetail: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleTicketData {
  sale: SaleTicketHeader;
  items: SaleTicketItem[];
}

export interface SaleTicketResponse extends SaleTicketData {
  idSale: number;
  saleNumber: string;
  htmlTemplate: string;
}
