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

function getCurrentDateParts(): {
  todayDate: string;
  currentYear: number;
  currentMonth: number;
} {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const month = String(currentMonth).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return {
    todayDate: `${currentYear}-${month}-${day}`,
    currentYear,
    currentMonth,
  };
}

async function getPurchaseMetricsFallback(
  idBusiness: number,
): Promise<Pick<
  DashboardMetrics,
  | "todayPurchasesTotal"
  | "monthPurchasesTotal"
  | "todayPurchasesCount"
  | "monthAveragePurchase"
>> {
  const currentDate = getCurrentDateParts();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
      COALESCE(SUM(CASE
        WHEN DATE(p.purchase_date) = ? THEN p.total
        ELSE 0
      END), 0) AS todayPurchasesTotal,
      COALESCE(SUM(CASE
        WHEN YEAR(p.purchase_date) = ?
         AND MONTH(p.purchase_date) = ? THEN p.total
        ELSE 0
      END), 0) AS monthPurchasesTotal,
      COALESCE(SUM(CASE
        WHEN DATE(p.purchase_date) = ? THEN 1
        ELSE 0
      END), 0) AS todayPurchasesCount,
      COALESCE(
        SUM(CASE
          WHEN YEAR(p.purchase_date) = ?
           AND MONTH(p.purchase_date) = ? THEN p.total
          ELSE 0
        END)
        / NULLIF(SUM(CASE
          WHEN YEAR(p.purchase_date) = ?
           AND MONTH(p.purchase_date) = ? THEN 1
          ELSE 0
        END), 0),
        0
      ) AS monthAveragePurchase
     FROM purchases p
     WHERE p.idBusiness = ?
       AND p.status = 'COMPLETED'`,
    [
      currentDate.todayDate,
      currentDate.currentYear,
      currentDate.currentMonth,
      currentDate.todayDate,
      currentDate.currentYear,
      currentDate.currentMonth,
      currentDate.currentYear,
      currentDate.currentMonth,
      idBusiness,
    ],
  );
  const row = rows[0] as DashboardMetricsRow | undefined;

  return {
    todayPurchasesTotal: toNumber(row?.todayPurchasesTotal),
    monthPurchasesTotal: toNumber(row?.monthPurchasesTotal),
    todayPurchasesCount: toNumber(row?.todayPurchasesCount),
    monthAveragePurchase: toNumber(row?.monthAveragePurchase),
  };
}

function mapMetrics(
  row: DashboardMetricsRow | undefined,
  purchaseFallback: Pick<
    DashboardMetrics,
    | "todayPurchasesTotal"
    | "monthPurchasesTotal"
    | "todayPurchasesCount"
    | "monthAveragePurchase"
  >,
): DashboardMetrics {
  return {
    todaySalesTotal: toNumber(row?.todaySalesTotal),
    monthSalesTotal: toNumber(row?.monthSalesTotal),
    todaySalesCount: toNumber(row?.todaySalesCount),
    monthAverageTicket: toNumber(row?.monthAverageTicket),
    todayPurchasesTotal: purchaseFallback.todayPurchasesTotal,
    monthPurchasesTotal: purchaseFallback.monthPurchasesTotal,
    todayPurchasesCount: purchaseFallback.todayPurchasesCount,
    monthAveragePurchase: purchaseFallback.monthAveragePurchase,
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

  const purchaseFallback = await getPurchaseMetricsFallback(idBusiness);

  return {
    metrics: mapMetrics(metricsResult[0]?.[0], purchaseFallback),
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
