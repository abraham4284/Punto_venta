import type { RowDataPacket } from "mysql2";

export interface DashboardBusinessesRow extends RowDataPacket {
  total: number | null;
  active: number | null;
  inactive: number | null;
  newThisMonth: number | null;
  newPreviousMonth: number | null;
}

export interface DashboardSubscriptionsRow extends RowDataPacket {
  trial: number | null;
  active: number | null;
  pastDue: number | null;
  suspended: number | null;
  cancelled: number | null;
  expired: number | null;
  expiringSoon: number | null;
}

export interface DashboardRevenueRow extends RowDataPacket {
  approvedThisMonth: string | number | null;
  approvedPreviousMonth: string | number | null;
  pendingAmount: string | number | null;
  rejectedAmount: string | number | null;
  estimatedMrr: string | number | null;
}

export interface DashboardActivityRow extends RowDataPacket {
  salesToday: number | null;
  salesLast7Days: number | null;
  activeBusinessesToday: number | null;
  activeBusinessesLast7Days: number | null;
  inactiveBusinesses30Days: number | null;
  totalBusinessUsers: number | null;
  totalProducts: number | null;
  criticalStockItems: number | null;
}

export interface DashboardPeriodTotalRow extends RowDataPacket {
  period: string;
  total: number;
}

export interface DashboardPaymentPeriodRow extends RowDataPacket {
  period: string;
  amount: string | number;
}

export interface DashboardStatusRow extends RowDataPacket {
  status: string;
  total: number;
}

export interface DashboardAlertRow extends RowDataPacket {
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  total: number;
  targetUrl: string | null;
}

export interface PlatformDashboardResponse {
  businesses: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    newPreviousMonth: number;
    growthPercentage: number | null;
  };
  subscriptions: {
    trial: number;
    active: number;
    pastDue: number;
    suspended: number;
    cancelled: number;
    expired: number;
    expiringSoon: number;
  };
  revenue: {
    approvedThisMonth: number;
    approvedPreviousMonth: number;
    pendingAmount: number;
    rejectedAmount: number;
    estimatedMrr: number | null;
    monthlyVariationPercentage: number | null;
  };
  activity: {
    salesToday: number;
    salesLast7Days: number;
    activeBusinessesToday: number;
    activeBusinessesLast7Days: number;
    inactiveBusinesses30Days: number;
    totalBusinessUsers: number;
    totalProducts: number;
    criticalStockItems: number;
  };
  charts: {
    newBusinessesByMonth: Array<{ period: string; total: number }>;
    paymentsByMonth: Array<{ period: string; amount: number }>;
    subscriptionsByStatus: Array<{ status: string; total: number }>;
  };
  alerts: DashboardAlertRow[];
}
