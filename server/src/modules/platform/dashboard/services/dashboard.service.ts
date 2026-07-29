import { Decimal } from "decimal.js";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapPlatformSqlError } from "../../helpers/platform-error.helper.js";
import type {
  DashboardActivityRow,
  DashboardAlertRow,
  DashboardBusinessesRow,
  DashboardPaymentPeriodRow,
  DashboardPeriodTotalRow,
  DashboardRevenueRow,
  DashboardStatusRow,
  DashboardSubscriptionsRow,
  PlatformDashboardResponse,
} from "../types/index.js";

function numberValue(value: string | number | null | undefined): number {
  return new Decimal(value ?? 0).toNumber();
}

function percentVariation(current: number, previous: number): number | null {
  if (previous === 0) return null;

  return new Decimal(current)
    .minus(previous)
    .div(previous)
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();
}

export async function getPlatformDashboardService(): Promise<PlatformDashboardResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("CALL sp_platform_dashboard()");
    const result = rows as unknown as [
      DashboardBusinessesRow[],
      DashboardSubscriptionsRow[],
      DashboardRevenueRow[],
      DashboardActivityRow[],
      DashboardPeriodTotalRow[],
      DashboardPaymentPeriodRow[],
      DashboardStatusRow[],
      DashboardAlertRow[],
    ];

    const businesses = result[0]?.[0];
    const subscriptions = result[1]?.[0];
    const revenue = result[2]?.[0];
    const activity = result[3]?.[0];
    const approvedThisMonth = numberValue(revenue?.approvedThisMonth);
    const approvedPreviousMonth = numberValue(revenue?.approvedPreviousMonth);
    const newThisMonth = numberValue(businesses?.newThisMonth);
    const newPreviousMonth = numberValue(businesses?.newPreviousMonth);

    return {
      businesses: {
        total: numberValue(businesses?.total),
        active: numberValue(businesses?.active),
        inactive: numberValue(businesses?.inactive),
        newThisMonth,
        newPreviousMonth,
        growthPercentage: percentVariation(newThisMonth, newPreviousMonth),
      },
      subscriptions: {
        trial: numberValue(subscriptions?.trial),
        active: numberValue(subscriptions?.active),
        pastDue: numberValue(subscriptions?.pastDue),
        suspended: numberValue(subscriptions?.suspended),
        cancelled: numberValue(subscriptions?.cancelled),
        expired: numberValue(subscriptions?.expired),
        expiringSoon: numberValue(subscriptions?.expiringSoon),
      },
      revenue: {
        approvedThisMonth,
        approvedPreviousMonth,
        pendingAmount: numberValue(revenue?.pendingAmount),
        rejectedAmount: numberValue(revenue?.rejectedAmount),
        estimatedMrr: numberValue(revenue?.estimatedMrr),
        monthlyVariationPercentage: percentVariation(
          approvedThisMonth,
          approvedPreviousMonth,
        ),
      },
      activity: {
        salesToday: numberValue(activity?.salesToday),
        salesLast7Days: numberValue(activity?.salesLast7Days),
        activeBusinessesToday: numberValue(activity?.activeBusinessesToday),
        activeBusinessesLast7Days: numberValue(
          activity?.activeBusinessesLast7Days,
        ),
        inactiveBusinesses30Days: numberValue(activity?.inactiveBusinesses30Days),
        totalBusinessUsers: numberValue(activity?.totalBusinessUsers),
        totalProducts: numberValue(activity?.totalProducts),
        criticalStockItems: numberValue(activity?.criticalStockItems),
      },
      charts: {
        newBusinessesByMonth: (result[4] ?? []).map(function mapBusiness(row) {
          return { period: row.period, total: numberValue(row.total) };
        }),
        paymentsByMonth: (result[5] ?? []).map(function mapPayment(row) {
          return { period: row.period, amount: numberValue(row.amount) };
        }),
        subscriptionsByStatus: (result[6] ?? []).map(function mapStatus(row) {
          return { status: row.status, total: numberValue(row.total) };
        }),
      },
      alerts: result[7] ?? [],
    };
  } catch (error) {
    mapPlatformSqlError(error);
  }
}
