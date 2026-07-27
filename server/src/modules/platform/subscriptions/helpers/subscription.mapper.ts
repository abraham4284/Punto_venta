import type {
  BusinessSubscriptionResponse,
  BusinessSubscriptionRow,
  CurrentBusinessSubscriptionResponse,
  CurrentBusinessSubscriptionRow,
  SubscriptionEventResponse,
  SubscriptionEventRow,
  SubscriptionPaymentResponse,
  SubscriptionPaymentRow,
  SubscriptionPlanResponse,
  SubscriptionPlanRow,
} from "../types/index.js";
import { buildBusinessSubscriptionNotification } from "./business-subscription-notification.helper.js";

export function mapSubscriptionPlan(
  row: SubscriptionPlanRow,
): SubscriptionPlanResponse {
  return {
    idSubscriptionPlan: row.idSubscriptionPlan,
    code: row.code,
    name: row.name,
    description: row.description,
    billingPeriod: row.billingPeriod,
    price: row.price,
    currency: row.currency,
    trialDays: row.trialDays,
    maxUsers: row.maxUsers,
    maxProducts: row.maxProducts,
    maxDeposits: row.maxDeposits,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapBusinessSubscription(
  row: BusinessSubscriptionRow,
): BusinessSubscriptionResponse {
  return {
    idBusinessSubscription: row.idBusinessSubscription,
    business: {
      idBusiness: row.idBusiness,
      name: row.businessName,
      slug: row.businessSlug,
    },
    plan: {
      idSubscriptionPlan: row.idSubscriptionPlan,
      code: row.planCode,
      name: row.planName,
      billingPeriod: row.billingPeriod,
      price: row.price,
      currency: row.currency,
    },
    status: row.status,
    startsAt: row.startsAt,
    trialStartsAt: row.trialStartsAt,
    trialEndsAt: row.trialEndsAt,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    gracePeriodEndsAt: row.gracePeriodEndsAt,
    autoRenew: Boolean(row.autoRenew),
    cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
    cancelledAt: row.cancelledAt,
    suspendedAt: row.suspendedAt,
    expiredAt: row.expiredAt,
    cancellationReason: row.cancellationReason,
    suspensionReason: row.suspensionReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapSubscriptionPayment(
  row: SubscriptionPaymentRow,
): SubscriptionPaymentResponse {
  return {
    idSubscriptionPayment: row.idSubscriptionPayment,
    idBusinessSubscription: row.idBusinessSubscription,
    paymentNumber: row.paymentNumber,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.paymentMethod,
    status: row.status,
    paidAt: row.paidAt,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    externalReference: row.externalReference,
    providerPaymentId: row.providerPaymentId,
    observation: row.observation,
    createdByUserId: row.createdByUserId,
    createdByUserName: row.createdByUserName,
    businessName: row.businessName,
    planName: row.planName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapSubscriptionEvent(
  row: SubscriptionEventRow,
): SubscriptionEventResponse {
  return {
    idSubscriptionEvent: row.idSubscriptionEvent,
    idBusinessSubscription: row.idBusinessSubscription,
    eventType: row.eventType,
    previousStatus: row.previousStatus,
    newStatus: row.newStatus,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    createdByUserId: row.createdByUserId,
    createdByUserName: row.createdByUserName,
    businessName: row.businessName,
    createdAt: row.createdAt,
  };
}

export function mapCurrentBusinessSubscription(
  row?: CurrentBusinessSubscriptionRow,
): CurrentBusinessSubscriptionResponse {
  const notification = buildBusinessSubscriptionNotification(row);

  if (!row?.idBusinessSubscription || !row.idSubscriptionPlan) {
    return {
      subscription: null,
      plan: null,
      access: {
        canOperate: false,
        isTrial: false,
        isPastDue: false,
        isSuspended: true,
        businessStatus: null,
      },
      timeline: {
        relevantEndDate: null,
        daysRemaining: null,
        daysUntilSuspension: null,
      },
      notification,
    };
  }

  const isTrial = row.status === "TRIAL";
  const isPastDue = row.status === "PAST_DUE";
  const isBusinessActive = row.businessStatus === "ACTIVE";
  const isSuspended =
    row.status === "SUSPENDED" ||
    row.status === "CANCELLED" ||
    row.status === "EXPIRED";
  const canOperate =
    isBusinessActive &&
    (row.status === "TRIAL" || row.status === "ACTIVE" || isPastDue);

  return {
    subscription: {
      idBusinessSubscription: row.idBusinessSubscription,
      status: row.status!,
      startsAt: row.startsAt!,
      trialStartsAt: row.trialStartsAt,
      trialEndsAt: row.trialEndsAt,
      currentPeriodStart: row.currentPeriodStart,
      currentPeriodEnd: row.currentPeriodEnd,
      gracePeriodEndsAt: row.gracePeriodEndsAt,
      autoRenew: Boolean(row.autoRenew),
      cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
      cancelledAt: row.cancelledAt,
      suspendedAt: row.suspendedAt,
      expiredAt: row.expiredAt,
      cancellationReason: row.cancellationReason,
      suspensionReason: row.suspensionReason,
    },
    plan: {
      idSubscriptionPlan: row.idSubscriptionPlan,
      code: row.planCode!,
      name: row.planName!,
      billingPeriod: row.billingPeriod!,
      price: row.price!,
      currency: row.currency!,
      maxUsers: row.maxUsers,
      maxProducts: row.maxProducts,
      maxDeposits: row.maxDeposits,
    },
    access: {
      canOperate,
      isTrial,
      isPastDue,
      isSuspended: isSuspended || !isBusinessActive,
      businessStatus: row.businessStatus,
    },
    timeline: {
      relevantEndDate: row.relevantEndDate,
      daysRemaining: row.daysRemaining,
      daysUntilSuspension: row.daysUntilSuspension,
    },
    notification,
  };
}
