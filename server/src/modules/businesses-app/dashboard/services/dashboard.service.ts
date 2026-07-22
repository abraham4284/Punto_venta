import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import type {
  CriticalStockItem,
  CriticalStockRow,
  AvailableDashboardYearRow,
  DashboardData,
  DashboardMetrics,
  DashboardMetricsRow,
  MonthlySales,
  MonthlySalesRow,
  RecentSale,
  RecentSaleRow,
  SalesByPaymentMethod,
  SalesByPaymentMethodRow,
  TopProduct,
  TopProductRow,
} from "../types/index.js";

function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function mapMetrics(row: DashboardMetricsRow | undefined): DashboardMetrics {
  return {
    todaySalesTotal: toNumber(row?.todaySalesTotal),
    monthSalesTotal: toNumber(row?.monthSalesTotal),
    todaySalesCount: toNumber(row?.todaySalesCount),
    monthAverageTicket: toNumber(row?.monthAverageTicket),
    lowStockProducts: toNumber(row?.lowStockProducts),
    outOfStockProducts: toNumber(row?.outOfStockProducts),
    activeProducts: toNumber(row?.activeProducts),
    stockCostValue: toNumber(row?.stockCostValue),
  };
}

function mapRecentSale(row: RecentSaleRow): RecentSale {
  return {
    idSale: row.idSale,
    receiptNumber: row.receiptNumber,
    customerName: row.customerName,
    total: toNumber(row.total),
    status: row.status,
    saleDate: row.saleDate,
    createdAt: row.createdAt,
  };
}

function mapTopProduct(row: TopProductRow): TopProduct {
  return {
    idProduct: row.idProduct,
    productName: row.productName,
    quantitySold: toNumber(row.quantitySold),
    totalRevenue: toNumber(row.totalRevenue),
  };
}

function mapSalesByPaymentMethod(
  row: SalesByPaymentMethodRow,
): SalesByPaymentMethod {
  return {
    paymentMethodName: row.paymentMethodName,
    totalAmount: toNumber(row.totalAmount),
  };
}

function mapCriticalStock(row: CriticalStockRow): CriticalStockItem {
  return {
    idDeposit: row.idDeposit,
    depositName: row.depositName,
    idProduct: row.idProduct,
    productName: row.productName,
    currentStock: toNumber(row.currentStock),
    stockMin: toNumber(row.stockMin),
  };
}

function mapMonthlySales(row: MonthlySalesRow): MonthlySales {
  return {
    monthNumber: row.monthNumber,
    monthName: row.monthName,
    totalAmount: toNumber(row.totalAmount),
    salesCount: toNumber(row.salesCount),
  };
}

export async function getDashboardDataService(
  idBusiness: number,
  year: number,
): Promise<DashboardData> {
  const [metricsRows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_dashboard_metrics(?)",
    [idBusiness],
  );
  const [chartsRows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_dashboard_charts_and_lists(?, ?)",
    [idBusiness, year],
  );

  const metricsResult = metricsRows as unknown as DashboardMetricsRow[][];
  const chartsResult = chartsRows as unknown as [
    RecentSaleRow[],
    TopProductRow[],
    SalesByPaymentMethodRow[],
    CriticalStockRow[],
    MonthlySalesRow[],
    AvailableDashboardYearRow[],
  ];

  return {
    metrics: mapMetrics(metricsResult[0]?.[0]),
    recentSales: (chartsResult[0] ?? []).map(mapRecentSale),
    topProducts: (chartsResult[1] ?? []).map(mapTopProduct),
    salesByPaymentMethod: (chartsResult[2] ?? []).map(mapSalesByPaymentMethod),
    criticalStock: (chartsResult[3] ?? []).map(mapCriticalStock),
    monthlySales: (chartsResult[4] ?? []).map(mapMonthlySales),
    selectedYear: year,
    availableYears: (chartsResult[5] ?? []).map(function mapAvailableYear(row) {
      return toNumber(row.year);
    }),
  };
}
