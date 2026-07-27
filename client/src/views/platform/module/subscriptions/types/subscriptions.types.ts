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

export interface PlatformApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface PaginatedData<T> {
  records: T[];
  pagination: PaginationMeta;
}

export interface SubscriptionPlan {
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
  createdAt: string;
  updatedAt: string | null;
}

export interface SubscriptionPlanFormValues {
  code: string;
  name: string;
  description: string;
  billingPeriod: BillingPeriod;
  price: string;
  currency: string;
  trialDays: string;
  maxUsers: string;
  maxProducts: string;
  maxDeposits: string;
  unlimitedUsers: boolean;
  unlimitedProducts: boolean;
  unlimitedDeposits: boolean;
  isActive: boolean;
}

export interface CreateSubscriptionPlanBody {
  code: string;
  name: string;
  description: string | null;
  billingPeriod: BillingPeriod;
  price: number;
  currency: string;
  trialDays: number;
  maxUsers: number | null;
  maxProducts: number | null;
  maxDeposits: number | null;
  isActive: boolean;
}

export type UpdateSubscriptionPlanBody = Omit<
  CreateSubscriptionPlanBody,
  "code" | "isActive"
>;

export interface SubscriptionPlanFilters {
  search: string;
  billingPeriod: "ALL" | BillingPeriod;
  isActive: "ALL" | "ACTIVE" | "INACTIVE";
}

export interface BusinessSubscription {
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
  createdAt: string;
  updatedAt: string | null;
}

export interface BusinessSubscriptionFilters {
  search: string;
  status: "ALL" | SubscriptionStatus;
  idSubscriptionPlan: string;
  billingPeriod: "ALL" | BillingPeriod;
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
  effectiveMode: "IMMEDIATE";
}

export interface SubscriptionPayment {
  idSubscriptionPayment: number;
  idBusinessSubscription: number;
  paymentNumber: string;
  amount: string;
  currency: string;
  paymentMethod: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  externalReference: string | null;
  providerPaymentId: string | null;
  observation: string | null;
  createdByUserId: number | null;
  createdByUserName?: string | null;
  businessName?: string;
  planName?: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface SubscriptionPaymentFilters {
  idBusinessSubscription: string;
  idBusiness: string;
  status: "ALL" | SubscriptionPaymentStatus;
  paymentMethod: "ALL" | SubscriptionPaymentMethod;
}

export interface SubscriptionPaymentFormValues {
  idBusinessSubscription: string;
  amount: string;
  currency: string;
  paymentMethod: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  externalReference: string;
  providerPaymentId: string;
  observation: string;
}

export interface CreateSubscriptionPaymentBody {
  idBusinessSubscription: number;
  amount: number;
  currency: string;
  paymentMethod: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
  externalReference: string | null;
  providerPaymentId: string | null;
  observation: string | null;
}

export interface SubscriptionEvent {
  idSubscriptionEvent: number;
  idBusinessSubscription: number;
  eventType: SubscriptionEventType;
  previousStatus: SubscriptionStatus | null;
  newStatus: SubscriptionStatus | null;
  metadata: Record<string, unknown> | null;
  createdByUserId: number | null;
  createdByUserName?: string | null;
  businessName?: string;
  createdAt: string;
}

export interface SubscriptionEventFilters {
  idBusinessSubscription: string;
  idBusiness: string;
  eventType: "ALL" | SubscriptionEventType;
}

export type MutationResult =
  | { success: true; message: string }
  | { success: false; message: string; errors?: FieldError[] };
