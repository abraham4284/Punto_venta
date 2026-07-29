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
  alerts: Array<{
    type: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    title: string;
    description: string;
    total: number;
    targetUrl?: string | null;
  }>;
}
