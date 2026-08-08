export type PlatformNotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type PlatformNotificationType =
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

export interface PlatformNotificationResponse {
  idNotification: number;
  type: PlatformNotificationType;
  severity: PlatformNotificationSeverity;
  title: string;
  message: string;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  status: "ACTIVE" | "RESOLVED";
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PlatformNotificationFilters {
  page?: number;
  limit?: number;
  type?: PlatformNotificationType;
  severity?: PlatformNotificationSeverity;
  unreadOnly?: boolean;
}

export interface PlatformNotificationListResponse {
  notifications: PlatformNotificationResponse[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}
