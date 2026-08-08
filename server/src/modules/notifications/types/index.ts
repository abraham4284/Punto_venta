import type { RowDataPacket } from "mysql2";
import type { BusinessRole, PlatformRole } from "@/types/auth.types.js";

export type NotificationContext = "BUSINESS" | "PLATFORM";
export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type NotificationStatus = "ACTIVE" | "RESOLVED";
export type NotificationType =
  | "SUBSCRIPTION_TRIAL_ENDING"
  | "SUBSCRIPTION_PAST_DUE"
  | "SUBSCRIPTION_GRACE_ENDING"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_RENEWED"
  | "STOCK_CRITICAL"
  | "STOCK_OUT"
  | "CASH_SESSION_CLOSED_WITH_DIFFERENCE"
  | "BUSINESS_USER_CREATED"
  | "TEMPORARY_PASSWORD_ASSIGNED"
  | "BUSINESS_USER_DEACTIVATED";

export interface NotificationRow extends RowDataPacket {
  idNotification: number;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl: string | null;
  action_url?: string | null;
  metadata: string | Record<string, unknown> | null;
  status: NotificationStatus;
  isRead: number;
  is_read?: number;
  readAt: Date | null;
  read_at?: Date | null;
  createdAt: Date;
  created_at?: Date;
}

export interface NotificationTotalRow extends RowDataPacket {
  totalRecords: number;
}

export interface NotificationCountRow extends RowDataPacket {
  unreadCount: number;
}

export interface NotificationIdRow extends RowDataPacket {
  idNotification: number;
}

export interface NotificationResponse {
  idNotification: number;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  status: NotificationStatus;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  pagination: NotificationPagination;
}

export interface NotificationListFilters {
  page: number;
  limit: number;
  offset: number;
  type?: NotificationType;
  severity?: NotificationSeverity;
  unreadOnly?: boolean;
}

export interface BusinessNotificationTarget {
  roles?: BusinessRole[];
  userIds?: number[];
}

export interface PlatformNotificationTarget {
  roles?: PlatformRole[];
  platformUserIds?: number[];
}

export interface CreateBusinessNotificationInput extends BusinessNotificationTarget {
  idBusiness: number;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  deduplicationKey?: string | null;
  expiresAt?: Date | string | null;
  createdByUserId?: number | null;
  createdByPlatformUserId?: number | null;
}

export interface CreatePlatformNotificationInput extends PlatformNotificationTarget {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  deduplicationKey?: string | null;
  expiresAt?: Date | string | null;
  createdByPlatformUserId?: number | null;
}

export interface StockEvaluationInput {
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
}

export interface StockEvaluationRow extends RowDataPacket {
  idBusiness: number;
  idProduct: number;
  idDeposit: number;
  productName: string;
  depositName: string;
  quantity: string | number;
  stockMin: string | number | null;
}
