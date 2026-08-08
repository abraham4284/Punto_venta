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
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: NotificationType;
  severity?: NotificationSeverity;
  unreadOnly?: boolean;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}
