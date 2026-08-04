export type BusinessActivityStatus =
  | "ACTIVE_TODAY"
  | "ACTIVE_7_DAYS"
  | "ACTIVE_30_DAYS"
  | "INACTIVE_30_DAYS"
  | "NEVER_ACTIVATED";

export interface PlatformBusinessListItem {
  idBusiness: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: string | null;
  isActive: boolean;
  businessStatus: string;
  owner: {
    idUser: number | null;
    name: string | null;
    username: string | null;
    email: string | null;
  };
  subscription: {
    idBusinessSubscription: number | null;
    planName: string | null;
    planCode: string | null;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  usage: {
    activeUsers: number;
    products: number;
    deposits: number;
  };
  activity: {
    lastLoginAt: string | null;
    lastSaleAt: string | null;
    lastPurchaseAt: string | null;
    activityStatus: BusinessActivityStatus;
  };
  createdAt: string;
}

export interface PlatformBusinessDetail extends Omit<PlatformBusinessListItem, "usage" | "activity"> {
  updatedAt: string | null;
  activity: PlatformBusinessActivity;
  usage: PlatformBusinessUsage;
}

export interface PlatformBusinessUser {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  userIsActive: boolean;
  membershipIsActive: boolean;
  effectiveIsActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ResetBusinessUserPasswordBody {
  mode: "GENERATE";
}

export interface ResetBusinessUserPasswordResponse {
  user: {
    idBusiness: number;
    idUser: number;
    name: string;
    username: string;
    email: string | null;
    role: string;
    mustChangePassword: boolean;
  };
  temporaryPassword: string;
  sessionsRevoked: number;
  warning: string;
}

export interface PlatformBusinessActivity {
  lastLoginAt: string | null;
  lastSaleAt: string | null;
  lastPurchaseAt: string | null;
  lastStockMovementAt: string | null;
  salesToday: number;
  salesLast7Days: number;
  salesLast30Days: number;
  purchasesLast30Days: number;
  stockMovementsLast30Days: number;
  activeUsersLast30Days: number;
  activityStatus: BusinessActivityStatus;
}

export interface PlatformBusinessUsage {
  users: UsageMetric;
  products: UsageMetric;
  deposits: UsageMetric;
  bulkImportEnabled: boolean;
}

export interface UsageMetric {
  current: number;
  limit: number | null;
  percentage: number | null;
  reached: boolean;
  exceeded: boolean;
}

export interface PlatformBusinessSale {
  idSale: number;
  saleNumber: string;
  saleDate: string;
  total: number;
  status: string;
  userName: string;
  customerName: string;
}

export interface PlatformBusinessPurchase {
  idPurchase: number;
  purchaseNumber: string;
  purchaseDate: string;
  total: number;
  status: string;
  userName: string;
  supplierName: string | null;
}

export interface PlatformBusinessFilters {
  search: string;
  businessStatus: string;
  subscriptionStatus: string;
  planId: string;
  businessType: string;
  activityStatus: string;
  createdFrom: string;
  createdTo: string;
}

export interface PaginatedData<T> {
  rows: T[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}
