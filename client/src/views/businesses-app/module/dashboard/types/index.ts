export type DashboardSaleStatus = "COMPLETED" | "CANCELLED";

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

export interface RecentSale {
  idSale: number;
  receiptNumber: number;
  customerName: string;
  total: number;
  status: DashboardSaleStatus;
  saleDate: Date;
  createdAt: Date;
}

export interface TopProduct {
  idProduct: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface SalesByPaymentMethod {
  paymentMethodName: string;
  totalAmount: number;
}

export interface CriticalStockItem {
  idDeposit: number;
  depositName: string;
  idProduct: number;
  productName: string;
  currentStock: number;
  stockMin: number;
}

export interface MonthlySales {
  monthNumber: number;
  monthName: string;
  totalAmount: number;
  salesCount: number;
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
