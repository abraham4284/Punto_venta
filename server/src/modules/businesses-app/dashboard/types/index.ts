export type DashboardSaleStatus = "COMPLETED" | "CANCELLED";

export interface DashboardMetricsRow {
  todaySalesTotal: string | number;
  monthSalesTotal: string | number;
  todaySalesCount: string | number;
  monthAverageTicket: string | number;
  lowStockProducts: string | number;
  outOfStockProducts: string | number;
  activeProducts: string | number;
  stockCostValue: string | number;
}

export interface DashboardMetrics {
  todaySalesTotal: number;
  monthSalesTotal: number;
  todaySalesCount: number;
  monthAverageTicket: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  activeProducts: number;
  stockCostValue: number;
}

export interface RecentSaleRow {
  idSale: number;
  receiptNumber: number;
  customerName: string;
  total: string | number;
  status: DashboardSaleStatus;
  saleDate: Date;
  createdAt: Date;
}

export interface RecentSale {
  idSale: number;
  receiptNumber: number;
  customerName: string;
  total: number;
  status: DashboardSaleStatus;
  saleDate: Date;
  createdAt: Date;
}

export interface TopProductRow {
  idProduct: number;
  productName: string;
  quantitySold: string | number;
  totalRevenue: string | number;
}

export interface TopProduct {
  idProduct: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface SalesByPaymentMethodRow {
  paymentMethodName: string;
  totalAmount: string | number;
}

export interface SalesByPaymentMethod {
  paymentMethodName: string;
  totalAmount: number;
}

export interface CriticalStockRow {
  idDeposit: number;
  depositName: string;
  idProduct: number;
  productName: string;
  currentStock: string | number;
  stockMin: string | number;
}

export interface CriticalStockItem {
  idDeposit: number;
  depositName: string;
  idProduct: number;
  productName: string;
  currentStock: number;
  stockMin: number;
}

export interface MonthlySalesRow {
  monthNumber: number;
  monthName: string;
  totalAmount: string | number;
  salesCount: string | number;
}

export interface MonthlySales {
  monthNumber: number;
  monthName: string;
  totalAmount: number;
  salesCount: number;
}

export interface AvailableDashboardYearRow {
  year: string | number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentSales: RecentSale[];
  topProducts: TopProduct[];
  salesByPaymentMethod: SalesByPaymentMethod[];
  criticalStock: CriticalStockItem[];
  monthlySales: MonthlySales[];
  selectedYear: number;
  availableYears: number[];
}
