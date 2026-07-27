import type { RowDataPacket } from "mysql2";

export type BillingPeriod = "MONTHLY" | "YEARLY";
export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";
export type SubscriptionPaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "MERCADO_PAGO"
  | "CARD"
  | "OTHER";
export type SubscriptionPaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED";
export type SubscriptionEventType =
  | "TRIAL_STARTED"
  | "TRIAL_EXPIRED"
  | "PAYMENT_CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_REFUNDED"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_PAST_DUE"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_REACTIVATED"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_EXPIRED"
  | "PLAN_CHANGED"
  | "AUTO_RENEW_ENABLED"
  | "AUTO_RENEW_DISABLED";

export interface SubscriptionPlanRow extends RowDataPacket {
  idSubscriptionPlan: number;
  code: string;
  name: string;
  description: string | null;
  billingPeriod: BillingPeriod;
  price: string;
  currency: string;
  trialDays: number;
  maxUsers: number | null;
  maxProducts: number | null;
  maxDeposits: number | null;
  isActive: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SubscriptionPlanResponse {
  idSubscriptionPlan: number;
  code: string;
  name: string;
  description: string | null;
  billingPeriod: BillingPeriod;
  price: string;
  currency: string;
  trialDays: number;
  maxUsers: number | null;
  maxProducts: number | null;
  maxDeposits: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateSubscriptionPlanBody {
  code: string;
  name: string;
  description?: string | null;
  billingPeriod: BillingPeriod;
  price: number;
  currency: string;
  trialDays: number;
  maxUsers?: number | null;
  maxProducts?: number | null;
  maxDeposits?: number | null;
  isActive: boolean;
}

export interface UpdateSubscriptionPlanBody {
  name?: string;
  description?: string | null;
  billingPeriod?: BillingPeriod;
  price?: number;
  currency?: string;
  trialDays?: number;
  maxUsers?: number | null;
  maxProducts?: number | null;
  maxDeposits?: number | null;
}

export interface ToggleSubscriptionPlanStatusBody {
  isActive: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  records: T[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

export interface PlanListFilters {
  search?: string | null;
  billingPeriod?: BillingPeriod | null;
  isActive?: boolean | null;
}

export interface BusinessSubscriptionRow extends RowDataPacket {
  idBusinessSubscription: number;
  idBusiness: number;
  businessName: string;
  businessSlug: string;
  idSubscriptionPlan: number;
  planCode: string;
  planName: string;
  billingPeriod: BillingPeriod;
  price: string;
  currency: string;
  status: SubscriptionStatus;
  startsAt: Date;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  gracePeriodEndsAt: Date | null;
  autoRenew: number;
  cancelAtPeriodEnd: number;
  cancelledAt: Date | null;
  suspendedAt: Date | null;
  expiredAt: Date | null;
  cancellationReason: string | null;
  suspensionReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface BusinessSubscriptionResponse {
  idBusinessSubscription: number;
  business: {
    idBusiness: number;
    name: string;
    slug: string;
  };
  plan: {
    idSubscriptionPlan: number;
    code: string;
    name: string;
    billingPeriod: BillingPeriod;
    price: string;
    currency: string;
  };
  status: SubscriptionStatus;
  startsAt: Date;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  gracePeriodEndsAt: Date | null;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  suspendedAt: Date | null;
  expiredAt: Date | null;
  cancellationReason: string | null;
  suspensionReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SubscriptionListFilters {
  search?: string | null;
  idBusiness?: number | null;
  idSubscriptionPlan?: number | null;
  status?: SubscriptionStatus | null;
  billingPeriod?: BillingPeriod | null;
  trialEndsBefore?: string | null;
  periodEndsBefore?: string | null;
}

export interface AssignSubscriptionBody {
  idBusiness: number;
  idSubscriptionPlan: number;
  startMode: "TRIAL" | "ACTIVE";
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}

export interface ChangeSubscriptionPlanBody {
  idSubscriptionPlan: number;
  effectiveMode: "IMMEDIATE" | "NEXT_PERIOD";
}

export interface SubscriptionReasonBody {
  reason: string;
}

export interface CancelSubscriptionBody {
  reason: string;
  cancelAtPeriodEnd: boolean;
}

export interface AutoRenewBody {
  autoRenew: boolean;
}

export interface SubscriptionPaymentRow extends RowDataPacket {
  idSubscriptionPayment: number;
  idBusinessSubscription: number;
  paymentNumber: string;
  amount: string;
  currency: string;
  paymentMethod: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  paidAt: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  externalReference: string | null;
  providerPaymentId: string | null;
  observation: string | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  businessName: string;
  planName: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SubscriptionPaymentResponse {
  idSubscriptionPayment: number;
  idBusinessSubscription: number;
  paymentNumber: string;
  amount: string;
  currency: string;
  paymentMethod: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  paidAt: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  externalReference: string | null;
  providerPaymentId: string | null;
  observation: string | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  businessName: string;
  planName: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface PaymentListFilters {
  idBusinessSubscription?: number | null;
  idBusiness?: number | null;
  status?: SubscriptionPaymentStatus | null;
  paymentMethod?: SubscriptionPaymentMethod | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface CreateSubscriptionPaymentBody {
  idBusinessSubscription: number;
  amount: number;
  currency: string;
  paymentMethod: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  paidAt?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  externalReference?: string | null;
  providerPaymentId?: string | null;
  observation?: string | null;
}

export interface UpdatePaymentStatusBody {
  observation?: string | null;
}

export interface SubscriptionEventRow extends RowDataPacket {
  idSubscriptionEvent: number;
  idBusinessSubscription: number;
  eventType: SubscriptionEventType;
  previousStatus: SubscriptionStatus | null;
  newStatus: SubscriptionStatus | null;
  metadata: string | null;
  createdByUserId: number | null;
  createdByUserName: string | null;
  businessName: string;
  createdAt: Date;
}

export interface SubscriptionEventResponse {
  idSubscriptionEvent: number;
  idBusinessSubscription: number;
  eventType: SubscriptionEventType;
  previousStatus: SubscriptionStatus | null;
  newStatus: SubscriptionStatus | null;
  metadata: unknown;
  createdByUserId: number | null;
  createdByUserName: string | null;
  businessName: string;
  createdAt: Date;
}

export interface EventListFilters {
  idBusinessSubscription?: number | null;
  idBusiness?: number | null;
  eventType?: SubscriptionEventType | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface CurrentBusinessSubscriptionResponse {
  subscription: {
    idBusinessSubscription: number;
    status: SubscriptionStatus;
    startsAt: Date;
    trialStartsAt: Date | null;
    trialEndsAt: Date | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    gracePeriodEndsAt: Date | null;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
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
    businessStatus: "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | null;
    daysRemaining: number | null;
    warning: string | null;
  };
}

export interface CurrentBusinessSubscriptionRow extends RowDataPacket {
  idBusinessSubscription: number | null;
  status: SubscriptionStatus | null;
  startsAt: Date | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  gracePeriodEndsAt: Date | null;
  autoRenew: number | null;
  cancelAtPeriodEnd: number | null;
  businessStatus: "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | null;
  idSubscriptionPlan: number | null;
  planCode: string | null;
  planName: string | null;
  billingPeriod: BillingPeriod | null;
  price: string | null;
  currency: string | null;
  maxUsers: number | null;
  maxProducts: number | null;
  maxDeposits: number | null;
  daysRemaining: number | null;
}

export interface TotalRow extends RowDataPacket {
  totalRecords: number;
}

export interface SubscriptionServiceError extends Error {
  statusCode: number;
  code: string;
}
