import type { RowDataPacket } from "mysql2";

export type BusinessActivityStatus =
  | "ACTIVE_TODAY"
  | "ACTIVE_7_DAYS"
  | "ACTIVE_30_DAYS"
  | "INACTIVE_30_DAYS"
  | "NEVER_ACTIVATED";

export interface PlatformBusinessListQuery {
  search?: string;
  businessStatus?: string;
  subscriptionStatus?: string;
  planId?: number;
  businessType?: string;
  activityStatus?: BusinessActivityStatus;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
}

export interface PlatformBusinessRow extends RowDataPacket {
  idBusiness: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: string | null;
  isActive: number;
  businessStatus: string;
  ownerIdUser: number | null;
  ownerName: string | null;
  ownerUsername: string | null;
  ownerEmail: string | null;
  idBusinessSubscription: number | null;
  planName: string | null;
  planCode: string | null;
  subscriptionStatus: string | null;
  startDate: string | null;
  endDate: string | null;
  activeUsers: number;
  products: number;
  deposits: number;
  lastLoginAt: string | null;
  lastSaleAt: string | null;
  lastPurchaseAt: string | null;
  activityStatus: BusinessActivityStatus;
  createdAt: string;
  updatedAt?: string | null;
  startsAt?: string | null;
  trialEndsAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  autoRenew?: number | null;
  idSubscriptionPlan?: number | null;
  billingPeriod?: string | null;
  maxUsers?: number | null;
  maxProducts?: number | null;
  maxDeposits?: number | null;
}

export interface PlatformBusinessUserRow extends RowDataPacket {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  userIsActive: number;
  membershipIsActive: number;
  effectiveIsActive: number;
  mustChangePassword: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PlatformBusinessActivityRow extends RowDataPacket {
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

export interface PlatformBusinessUsageRow extends RowDataPacket {
  currentUsers: number;
  maxUsers: number | null;
  currentProducts: number;
  maxProducts: number | null;
  currentDeposits: number;
  maxDeposits: number | null;
  bulkImportEnabled: number;
}

export interface PlatformBusinessSaleRow extends RowDataPacket {
  idSale: number;
  saleNumber: string;
  saleDate: string;
  total: string | number;
  status: string;
  userName: string;
  customerName: string;
}

export interface PlatformBusinessPurchaseRow extends RowDataPacket {
  idPurchase: number;
  purchaseNumber: string;
  purchaseDate: string;
  total: string | number;
  status: string;
  userName: string;
  supplierName: string | null;
}

export interface TotalRow extends RowDataPacket {
  totalRecords: number;
}

export interface PlatformBusinessStatusBody {
  isActive: boolean;
  reason: string;
}

export interface ResetBusinessUserPasswordBody {
  mode: "GENERATE";
}

export interface PlatformBusinessUserPasswordResetRow extends RowDataPacket {
  idBusiness: number;
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  sessionsRevoked: number;
  mustChangePassword: number;
}
