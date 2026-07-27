export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

export type BillingPeriod = "MONTHLY" | "YEARLY";

export type BusinessStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";

export type SubscriptionNotificationSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL"
  | "BLOCKED";

export type SubscriptionNotificationCode =
  | "NO_SUBSCRIPTION"
  | "BUSINESS_INACTIVE"
  | "TRIAL_ACTIVE"
  | "TRIAL_ENDING"
  | "ACTIVE_OK"
  | "ACTIVE_ENDING"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED"
  | "CANCELLATION_SCHEDULED";

export interface BusinessSubscriptionResponse {
  subscription: {
    idBusinessSubscription: number;
    status: SubscriptionStatus;
    startsAt: string;
    trialStartsAt: string | null;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    gracePeriodEndsAt: string | null;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    suspendedAt: string | null;
    expiredAt: string | null;
    cancellationReason: string | null;
    suspensionReason: string | null;
  } | null;
  plan: {
    idSubscriptionPlan: number;
    code: string;
    name: string;
    billingPeriod: BillingPeriod;
    price: string;
    currency: string;
    maxUsers: number | null;
    maxProducts: number | null;
    maxDeposits: number | null;
  } | null;
  access: {
    canOperate: boolean;
    isTrial: boolean;
    isPastDue: boolean;
    isSuspended: boolean;
    businessStatus: BusinessStatus | null;
  };
  timeline: {
    relevantEndDate: string | null;
    daysRemaining: number | null;
    daysUntilSuspension: number | null;
  };
  notification: {
    severity: SubscriptionNotificationSeverity;
    code: SubscriptionNotificationCode;
    title: string;
    message: string;
    reason: string | null;
    shouldShowBanner: boolean;
    shouldBlockApplication: boolean;
  };
}

export interface BusinessSubscriptionApiResponse {
  success: boolean;
  message: string;
  data: BusinessSubscriptionResponse;
  code?: string;
}
