import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { safeCreateBusinessNotification } from "@/modules/notifications/services/notifications.service.js";
import {
  mapBusinessSubscription,
  mapCurrentBusinessSubscription,
  mapSubscriptionEvent,
  mapSubscriptionPayment,
  mapSubscriptionPlan,
} from "../helpers/subscription.mapper.js";
import {
  createSubscriptionServiceError,
  mapSubscriptionSqlError,
} from "../helpers/subscription-error.helper.js";
import type {
  AssignSubscriptionBody,
  AutoRenewBody,
  BusinessOptionResponse,
  BusinessOptionRow,
  BusinessSubscriptionResponse,
  BusinessSubscriptionRow,
  CancelSubscriptionBody,
  ChangeSubscriptionPlanBody,
  CreateSubscriptionPaymentBody,
  CreateSubscriptionPlanBody,
  CurrentBusinessSubscriptionResponse,
  CurrentBusinessSubscriptionRow,
  EventListFilters,
  PaginatedResponse,
  PaginationParams,
  PaymentListFilters,
  PlanListFilters,
  SubscriptionEventResponse,
  SubscriptionEventRow,
  SubscriptionListFilters,
  SubscriptionPaymentResponse,
  SubscriptionPaymentRow,
  SubscriptionPlanResponse,
  SubscriptionPlanRow,
  SubscriptionReasonBody,
  ToggleSubscriptionPlanStatusBody,
  TotalRow,
  UpdatePaymentStatusBody,
  UpdateSubscriptionPlanBody,
} from "../types/index.js";

function getTotalPages(totalRecords: number, limit: number): number {
  return Math.max(Math.ceil(totalRecords / limit), 1);
}

function buildPaginatedResponse<T>(
  records: T[],
  totalRecords: number,
  pagination: PaginationParams,
): PaginatedResponse<T> {
  return {
    records,
    pagination: {
      totalRecords,
      currentPage: pagination.page,
      totalPages: getTotalPages(totalRecords, pagination.limit),
      limit: pagination.limit,
    },
  };
}

function getTotal(resultset: TotalRow[][]): number {
  return resultset[0]?.[0]?.totalRecords ?? 0;
}

function generatePaymentNumber(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `SUB-${year}${month}${day}-${random}`;
}

function mapBusinessOption(row: BusinessOptionRow): BusinessOptionResponse {
  return {
    idBusiness: row.idBusiness,
    name: row.name,
    slug: row.slug,
    status: row.status,
    isActive: Boolean(row.isActive),
  };
}

async function getBusinessIdByBusinessSubscriptionId(
  idBusinessSubscription: number,
): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT idBusiness
       FROM business_subscriptions
      WHERE idBusinessSubscription = ?
      LIMIT 1`,
    [idBusinessSubscription],
  );

  return rows[0]?.idBusiness ? Number(rows[0].idBusiness) : null;
}

export async function listBusinessOptionsService(): Promise<
  BusinessOptionResponse[]
> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_platform_business_options()",
  );
  const result = rows as unknown as BusinessOptionRow[][];

  return result[0].map(mapBusinessOption);
}

export async function listSubscriptionPlansService(
  filters: PlanListFilters,
  pagination: PaginationParams,
): Promise<PaginatedResponse<SubscriptionPlanResponse>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_subscription_plan_list(?, ?, ?, ?, ?)",
    [
      filters.search ?? null,
      filters.billingPeriod ?? null,
      typeof filters.isActive === "boolean" ? Number(filters.isActive) : null,
      pagination.limit,
      pagination.offset,
    ],
  );
  const result = rows as unknown as [SubscriptionPlanRow[], TotalRow[]];

  return buildPaginatedResponse(
    result[0].map(mapSubscriptionPlan),
    getTotal([result[1]]),
    pagination,
  );
}

export async function getSubscriptionPlanByIdService(
  idSubscriptionPlan: number,
): Promise<SubscriptionPlanResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_subscription_plan_get_by_id(?)",
    [idSubscriptionPlan],
  );
  const result = rows as unknown as SubscriptionPlanRow[][];
  const plan = result[0]?.[0];

  if (!plan) {
    throw createSubscriptionServiceError(
      "Plan de suscripcion no encontrado",
      404,
      "SUBSCRIPTION_PLAN_NOT_FOUND",
    );
  }

  return mapSubscriptionPlan(plan);
}

export async function createSubscriptionPlanService(
  data: CreateSubscriptionPlanBody,
): Promise<SubscriptionPlanResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_subscription_plan_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.code,
        data.name,
        data.description ?? null,
        data.billingPeriod,
        data.price,
        data.currency,
        data.trialDays,
        data.maxUsers ?? null,
        data.maxProducts ?? null,
        data.maxDeposits ?? null,
        Number(data.isActive),
      ],
    );
    const result = rows as unknown as SubscriptionPlanRow[][];
    return mapSubscriptionPlan(result[0][0]);
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function updateSubscriptionPlanService(
  idSubscriptionPlan: number,
  data: UpdateSubscriptionPlanBody,
): Promise<SubscriptionPlanResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_subscription_plan_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        idSubscriptionPlan,
        data.name ?? null,
        data.description ?? null,
        Object.hasOwn(data, "description") ? 1 : 0,
        data.billingPeriod ?? null,
        data.price ?? null,
        data.currency ?? null,
        data.trialDays ?? null,
        data.maxUsers ?? null,
        Object.hasOwn(data, "maxUsers") ? 1 : 0,
        data.maxProducts ?? null,
        Object.hasOwn(data, "maxProducts") ? 1 : 0,
        data.maxDeposits ?? null,
        Object.hasOwn(data, "maxDeposits") ? 1 : 0,
      ],
    );
    const result = rows as unknown as SubscriptionPlanRow[][];
    return mapSubscriptionPlan(result[0][0]);
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function toggleSubscriptionPlanStatusService(
  idSubscriptionPlan: number,
  data: ToggleSubscriptionPlanStatusBody,
): Promise<SubscriptionPlanResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_subscription_plan_toggle_status(?, ?)",
      [idSubscriptionPlan, Number(data.isActive)],
    );
    const result = rows as unknown as SubscriptionPlanRow[][];
    return mapSubscriptionPlan(result[0][0]);
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function listBusinessSubscriptionsService(
  filters: SubscriptionListFilters,
  pagination: PaginationParams,
): Promise<PaginatedResponse<BusinessSubscriptionResponse>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_subscription_list(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      filters.search ?? null,
      filters.idBusiness ?? null,
      filters.idSubscriptionPlan ?? null,
      filters.status ?? null,
      filters.billingPeriod ?? null,
      filters.trialEndsBefore ?? null,
      filters.periodEndsBefore ?? null,
      pagination.limit,
      pagination.offset,
    ],
  );
  const result = rows as unknown as [BusinessSubscriptionRow[], TotalRow[]];

  return buildPaginatedResponse(
    result[0].map(mapBusinessSubscription),
    getTotal([result[1]]),
    pagination,
  );
}

export async function getBusinessSubscriptionByIdService(
  idBusinessSubscription: number,
): Promise<BusinessSubscriptionResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_subscription_get_by_id(?)",
    [idBusinessSubscription],
  );
  const result = rows as unknown as BusinessSubscriptionRow[][];
  const subscription = result[0]?.[0];

  if (!subscription) {
    throw createSubscriptionServiceError(
      "Suscripcion no encontrada",
      404,
      "SUBSCRIPTION_NOT_FOUND",
    );
  }

  return mapBusinessSubscription(subscription);
}

export async function assignBusinessSubscriptionService(
  data: AssignSubscriptionBody,
  createdByUserId: number,
): Promise<BusinessSubscriptionResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_subscription_assign(?, ?, ?, ?, ?, ?)",
      [
        data.idBusiness,
        data.idSubscriptionPlan,
        data.startMode,
        data.currentPeriodStart ?? null,
        data.currentPeriodEnd ?? null,
        createdByUserId,
      ],
    );
    const result = rows as unknown as BusinessSubscriptionRow[][];
    return mapBusinessSubscription(result[0][0]);
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function changeBusinessSubscriptionPlanService(
  idBusinessSubscription: number,
  data: ChangeSubscriptionPlanBody,
  createdByUserId: number,
): Promise<BusinessSubscriptionResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_subscription_change_plan(?, ?, ?, ?)",
      [
        idBusinessSubscription,
        data.idSubscriptionPlan,
        data.effectiveMode,
        createdByUserId,
      ],
    );
    const result = rows as unknown as BusinessSubscriptionRow[][];
    return mapBusinessSubscription(result[0][0]);
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function suspendBusinessSubscriptionService(
  idBusinessSubscription: number,
  data: SubscriptionReasonBody,
  createdByUserId: number,
): Promise<BusinessSubscriptionResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_subscription_suspend(?, ?, ?)",
      [idBusinessSubscription, data.reason, createdByUserId],
    );
    const result = rows as unknown as BusinessSubscriptionRow[][];
    const subscription = mapBusinessSubscription(result[0][0]);

    await safeCreateBusinessNotification({
      idBusiness: subscription.business.idBusiness,
      type: "SUBSCRIPTION_SUSPENDED",
      severity: "ERROR",
      title: "Suscripcion suspendida",
      message: "La suscripcion del negocio fue suspendida.",
      actionUrl: "/admin/subscription",
      metadata: {
        idBusinessSubscription,
        reason: data.reason,
        status: subscription.status,
      },
      roles: ["OWNER", "ADMIN"],
    });

    return subscription;
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function reactivateBusinessSubscriptionService(
  idBusinessSubscription: number,
  createdByUserId: number,
): Promise<BusinessSubscriptionResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_subscription_reactivate(?, ?)",
      [idBusinessSubscription, createdByUserId],
    );
    const result = rows as unknown as BusinessSubscriptionRow[][];
    const subscription = mapBusinessSubscription(result[0][0]);

    await safeCreateBusinessNotification({
      idBusiness: subscription.business.idBusiness,
      type: "SUBSCRIPTION_RENEWED",
      severity: "SUCCESS",
      title: "Suscripcion reactivada",
      message: "La suscripcion del negocio fue reactivada correctamente.",
      actionUrl: "/admin/subscription",
      metadata: {
        idBusinessSubscription,
        status: subscription.status,
      },
      roles: ["OWNER", "ADMIN"],
    });

    return subscription;
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function cancelBusinessSubscriptionService(
  idBusinessSubscription: number,
  data: CancelSubscriptionBody,
  createdByUserId: number,
): Promise<BusinessSubscriptionResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_subscription_cancel(?, ?, ?, ?)",
      [
        idBusinessSubscription,
        data.reason,
        Number(data.cancelAtPeriodEnd),
        createdByUserId,
      ],
    );
    const result = rows as unknown as BusinessSubscriptionRow[][];
    const subscription = mapBusinessSubscription(result[0][0]);

    await safeCreateBusinessNotification({
      idBusiness: subscription.business.idBusiness,
      type: "SUBSCRIPTION_CANCELLED",
      severity: "ERROR",
      title: "Suscripcion cancelada",
      message: "La suscripcion del negocio fue cancelada.",
      actionUrl: "/admin/subscription",
      metadata: {
        idBusinessSubscription,
        reason: data.reason,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        status: subscription.status,
      },
      roles: ["OWNER", "ADMIN"],
    });

    return subscription;
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function updateAutoRenewService(
  idBusinessSubscription: number,
  data: AutoRenewBody,
  createdByUserId: number,
): Promise<BusinessSubscriptionResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_subscription_auto_renew(?, ?, ?)",
      [idBusinessSubscription, Number(data.autoRenew), createdByUserId],
    );
    const result = rows as unknown as BusinessSubscriptionRow[][];
    return mapBusinessSubscription(result[0][0]);
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function listSubscriptionPaymentsService(
  filters: PaymentListFilters,
  pagination: PaginationParams,
): Promise<PaginatedResponse<SubscriptionPaymentResponse>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_subscription_payment_list(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      filters.idBusinessSubscription ?? null,
      filters.idBusiness ?? null,
      filters.status ?? null,
      filters.paymentMethod ?? null,
      filters.dateFrom ?? null,
      filters.dateTo ?? null,
      pagination.limit,
      pagination.offset,
    ],
  );
  const result = rows as unknown as [SubscriptionPaymentRow[], TotalRow[]];

  return buildPaginatedResponse(
    result[0].map(mapSubscriptionPayment),
    getTotal([result[1]]),
    pagination,
  );
}

export async function getSubscriptionPaymentByIdService(
  idSubscriptionPayment: number,
): Promise<SubscriptionPaymentResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_subscription_payment_get_by_id(?)",
    [idSubscriptionPayment],
  );
  const result = rows as unknown as SubscriptionPaymentRow[][];
  const payment = result[0]?.[0];

  if (!payment) {
    throw createSubscriptionServiceError(
      "Pago de suscripcion no encontrado",
      404,
      "PAYMENT_NOT_FOUND",
    );
  }

  return mapSubscriptionPayment(payment);
}

export async function createSubscriptionPaymentService(
  data: CreateSubscriptionPaymentBody,
  createdByUserId: number,
): Promise<SubscriptionPaymentResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_subscription_payment_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.idBusinessSubscription,
        generatePaymentNumber(),
        data.amount,
        data.currency,
        data.paymentMethod,
        data.status,
        data.paidAt ?? null,
        data.periodStart ?? null,
        data.periodEnd ?? null,
        data.externalReference ?? null,
        data.providerPaymentId ?? null,
        data.observation ?? null,
        createdByUserId,
      ],
    );
    const result = rows as unknown as SubscriptionPaymentRow[][];
    const payment = mapSubscriptionPayment(result[0][0]);

    if (payment.status === "APPROVED") {
      const idBusiness = await getBusinessIdByBusinessSubscriptionId(
        payment.idBusinessSubscription,
      );

      if (idBusiness) {
        await safeCreateBusinessNotification({
          idBusiness,
          type: "SUBSCRIPTION_RENEWED",
          severity: "SUCCESS",
          title: "Pago de suscripcion aprobado",
          message: "Tu pago fue aprobado y la suscripcion quedo actualizada.",
          actionUrl: "/admin/subscription",
          metadata: {
            idSubscriptionPayment: payment.idSubscriptionPayment,
            paymentNumber: payment.paymentNumber,
            amount: payment.amount,
            currency: payment.currency,
          },
          roles: ["OWNER", "ADMIN"],
        });
      }
    }

    return payment;
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function updatePaymentStatusService(
  idSubscriptionPayment: number,
  status: "APPROVED" | "REJECTED" | "CANCELLED" | "REFUNDED",
  data: UpdatePaymentStatusBody,
  createdByUserId: number,
): Promise<SubscriptionPaymentResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_subscription_payment_update_status(?, ?, ?, ?)",
      [idSubscriptionPayment, status, data.observation ?? null, createdByUserId],
    );
    const result = rows as unknown as SubscriptionPaymentRow[][];
    const payment = mapSubscriptionPayment(result[0][0]);

    if (payment.status === "APPROVED") {
      const idBusiness = await getBusinessIdByBusinessSubscriptionId(
        payment.idBusinessSubscription,
      );

      if (idBusiness) {
        await safeCreateBusinessNotification({
          idBusiness,
          type: "SUBSCRIPTION_RENEWED",
          severity: "SUCCESS",
          title: "Pago de suscripcion aprobado",
          message: "Tu pago fue aprobado y la suscripcion quedo actualizada.",
          actionUrl: "/admin/subscription",
          metadata: {
            idSubscriptionPayment: payment.idSubscriptionPayment,
            paymentNumber: payment.paymentNumber,
            amount: payment.amount,
            currency: payment.currency,
          },
          roles: ["OWNER", "ADMIN"],
        });
      }
    }

    return payment;
  } catch (error) {
    mapSubscriptionSqlError(error);
  }
}

export async function listSubscriptionEventsService(
  filters: EventListFilters,
  pagination: PaginationParams,
): Promise<PaginatedResponse<SubscriptionEventResponse>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_subscription_event_list(?, ?, ?, ?, ?, ?, ?)",
    [
      filters.idBusinessSubscription ?? null,
      filters.idBusiness ?? null,
      filters.eventType ?? null,
      filters.dateFrom ?? null,
      filters.dateTo ?? null,
      pagination.limit,
      pagination.offset,
    ],
  );
  const result = rows as unknown as [SubscriptionEventRow[], TotalRow[]];

  return buildPaginatedResponse(
    result[0].map(mapSubscriptionEvent),
    getTotal([result[1]]),
    pagination,
  );
}

export async function getCurrentBusinessSubscriptionService(
  idBusiness: number,
): Promise<CurrentBusinessSubscriptionResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_current_subscription(?)",
    [idBusiness],
  );
  const result = rows as unknown as CurrentBusinessSubscriptionRow[][];
  return mapCurrentBusinessSubscription(result[0]?.[0]);
}

export async function processExpiredSubscriptionsService(): Promise<{
  processedTrials: number;
  processedActive: number;
  processedGrace: number;
  processedScheduledCancellations: number;
}> {
  const graceDays = Number(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS || 5);
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_subscription_process_expirations(?, ?)",
    [graceDays, 500],
  );
  const result = rows as unknown as {
    processedTrials: number;
    processedActive: number;
    processedGrace: number;
    processedScheduledCancellations: number;
  }[][];

  return result[0][0];
}
