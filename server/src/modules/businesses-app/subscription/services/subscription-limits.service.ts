import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { getCurrentBusinessSubscriptionService } from "@/modules/platform/subscriptions/services/subscriptions.service.js";

export type SubscriptionLimitedResource = "USERS" | "PRODUCTS" | "DEPOSITS";

export interface SubscriptionResourceUsage {
  resource: SubscriptionLimitedResource;
  currentUsage: number;
  maximumAllowed: number | null;
  remaining: number | null;
  requestedAmount: number;
  limitReached: boolean;
}

export interface SubscriptionResourceLimitError extends Error {
  statusCode: number;
  code: "SUBSCRIPTION_RESOURCE_LIMIT_REACHED";
  data: SubscriptionResourceUsage & {
    planName: string | null;
  };
}

interface CountRow extends RowDataPacket {
  currentUsage: number;
}

const resourceMessages: Record<SubscriptionLimitedResource, string> = {
  USERS: "Alcanzaste el limite de usuarios permitido por tu plan.",
  PRODUCTS: "Alcanzaste el limite de productos permitido por tu plan.",
  DEPOSITS: "Alcanzaste el limite de depositos permitido por tu plan.",
};

function normalizeRequestedAmount(requestedAmount?: number): number {
  if (!requestedAmount || requestedAmount < 1) {
    return 1;
  }

  return Math.floor(requestedAmount);
}

function getMaximumAllowed(
  resource: SubscriptionLimitedResource,
  plan: {
    maxUsers: number | null;
    maxProducts: number | null;
    maxDeposits: number | null;
  },
): number | null {
  if (resource === "USERS") return plan.maxUsers;
  if (resource === "PRODUCTS") return plan.maxProducts;
  return plan.maxDeposits;
}

function buildUsage(
  resource: SubscriptionLimitedResource,
  currentUsage: number,
  maximumAllowed: number | null,
  requestedAmount: number,
): SubscriptionResourceUsage {
  if (maximumAllowed === null) {
    return {
      resource,
      currentUsage,
      maximumAllowed,
      remaining: null,
      requestedAmount,
      limitReached: false,
    };
  }

  const remaining = Math.max(maximumAllowed - currentUsage, 0);

  return {
    resource,
    currentUsage,
    maximumAllowed,
    remaining,
    requestedAmount,
    limitReached: currentUsage + requestedAmount > maximumAllowed,
  };
}

function createLimitReachedError(
  usage: SubscriptionResourceUsage,
  planName: string | null,
): SubscriptionResourceLimitError {
  const error = new Error(resourceMessages[usage.resource]) as SubscriptionResourceLimitError;
  error.statusCode = 409;
  error.code = "SUBSCRIPTION_RESOURCE_LIMIT_REACHED";
  error.data = {
    ...usage,
    planName,
  };
  return error;
}

async function countProducts(idBusiness: number): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS currentUsage
     FROM products
     WHERE idBusiness = ?
       AND is_active = 1`,
    [idBusiness],
  );

  return rows[0]?.currentUsage ?? 0;
}

async function countDeposits(idBusiness: number): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS currentUsage
     FROM deposits
     WHERE idBusiness = ?
       AND is_active = 1`,
    [idBusiness],
  );

  return rows[0]?.currentUsage ?? 0;
}

async function countUsers(idBusiness: number): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS currentUsage
     FROM business_users bu
     INNER JOIN users u
       ON u.idUser = bu.idUser
     WHERE bu.idBusiness = ?
       AND bu.is_active = 1
       AND u.is_active = 1`,
    [idBusiness],
  );

  return rows[0]?.currentUsage ?? 0;
}

export async function getSubscriptionResourceUsage(
  idBusiness: number,
  resource: SubscriptionLimitedResource,
  requestedAmount?: number,
): Promise<SubscriptionResourceUsage> {
  const subscription = await getCurrentBusinessSubscriptionService(idBusiness);

  if (!subscription.access.canOperate) {
    const error = new Error(subscription.notification.message);
    throw error;
  }

  const plan = subscription.plan;

  if (!plan) {
    const error = new Error("El negocio no tiene una suscripcion vigente");
    throw error;
  }

  const normalizedRequestedAmount = normalizeRequestedAmount(requestedAmount);
  const maximumAllowed = getMaximumAllowed(resource, plan);
  const currentUsage =
    resource === "USERS"
      ? await countUsers(idBusiness)
      : resource === "PRODUCTS"
        ? await countProducts(idBusiness)
        : await countDeposits(idBusiness);

  return buildUsage(
    resource,
    currentUsage,
    maximumAllowed,
    normalizedRequestedAmount,
  );
}

export async function assertSubscriptionResourceAvailable(
  idBusiness: number,
  resource: SubscriptionLimitedResource,
  requestedAmount?: number,
): Promise<void> {
  const subscription = await getCurrentBusinessSubscriptionService(idBusiness);

  if (!subscription.access.canOperate) {
    const error = new Error(subscription.notification.message);
    throw error;
  }

  const plan = subscription.plan;

  if (!plan) {
    const error = new Error("El negocio no tiene una suscripcion vigente");
    throw error;
  }

  const usage = await getSubscriptionResourceUsage(
    idBusiness,
    resource,
    requestedAmount,
  );

  if (usage.limitReached) {
    throw createLimitReachedError(usage, plan.name);
  }
}

export async function getSubscriptionUsageSummary(idBusiness: number): Promise<{
  users: {
    current: number;
    limit: number | null;
    remaining: number | null;
    limitReached: boolean;
  };
  products: {
    current: number;
    limit: number | null;
    remaining: number | null;
    limitReached: boolean;
  };
  deposits: {
    current: number;
    limit: number | null;
    remaining: number | null;
    limitReached: boolean;
  };
}> {
  const [users, products, deposits] = await Promise.all([
    getSubscriptionResourceUsage(idBusiness, "USERS", 1),
    getSubscriptionResourceUsage(idBusiness, "PRODUCTS", 1),
    getSubscriptionResourceUsage(idBusiness, "DEPOSITS", 1),
  ]);

  return {
    users: {
      current: users.currentUsage,
      limit: users.maximumAllowed,
      remaining: users.remaining,
      limitReached: users.limitReached,
    },
    products: {
      current: products.currentUsage,
      limit: products.maximumAllowed,
      remaining: products.remaining,
      limitReached: products.limitReached,
    },
    deposits: {
      current: deposits.currentUsage,
      limit: deposits.maximumAllowed,
      remaining: deposits.remaining,
      limitReached: deposits.limitReached,
    },
  };
}

export async function getSubscriptionUsageSummaryForPlan(
  idBusiness: number,
  plan: {
    maxUsers: number | null;
    maxProducts: number | null;
    maxDeposits: number | null;
  } | null,
): Promise<{
  users: {
    current: number;
    limit: number | null;
    remaining: number | null;
    limitReached: boolean;
  };
  products: {
    current: number;
    limit: number | null;
    remaining: number | null;
    limitReached: boolean;
  };
  deposits: {
    current: number;
    limit: number | null;
    remaining: number | null;
    limitReached: boolean;
  };
}> {
  const [usersCurrent, productsCurrent, depositsCurrent] = await Promise.all([
    countUsers(idBusiness),
    countProducts(idBusiness),
    countDeposits(idBusiness),
  ]);

  const users = buildUsage("USERS", usersCurrent, plan?.maxUsers ?? null, 1);
  const products = buildUsage(
    "PRODUCTS",
    productsCurrent,
    plan?.maxProducts ?? null,
    1,
  );
  const deposits = buildUsage(
    "DEPOSITS",
    depositsCurrent,
    plan?.maxDeposits ?? null,
    1,
  );

  return {
    users: {
      current: users.currentUsage,
      limit: users.maximumAllowed,
      remaining: users.remaining,
      limitReached: users.limitReached,
    },
    products: {
      current: products.currentUsage,
      limit: products.maximumAllowed,
      remaining: products.remaining,
      limitReached: products.limitReached,
    },
    deposits: {
      current: deposits.currentUsage,
      limit: deposits.maximumAllowed,
      remaining: deposits.remaining,
      limitReached: deposits.limitReached,
    },
  };
}

export function isSubscriptionResourceLimitError(
  error: unknown,
): error is SubscriptionResourceLimitError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "SUBSCRIPTION_RESOURCE_LIMIT_REACHED"
  );
}

export function createLimitErrorFromSqlMessage(
  message: string,
): SubscriptionResourceLimitError | null {
  if (message.includes("SUBSCRIPTION_USER_LIMIT_REACHED")) {
    return createLimitReachedError(
      {
        resource: "USERS",
        currentUsage: 0,
        maximumAllowed: 0,
        remaining: 0,
        requestedAmount: 1,
        limitReached: true,
      },
      null,
    );
  }

  if (message.includes("SUBSCRIPTION_PRODUCT_LIMIT_REACHED")) {
    return createLimitReachedError(
      {
        resource: "PRODUCTS",
        currentUsage: 0,
        maximumAllowed: 0,
        remaining: 0,
        requestedAmount: 1,
        limitReached: true,
      },
      null,
    );
  }

  if (message.includes("SUBSCRIPTION_DEPOSIT_LIMIT_REACHED")) {
    return createLimitReachedError(
      {
        resource: "DEPOSITS",
        currentUsage: 0,
        maximumAllowed: 0,
        remaining: 0,
        requestedAmount: 1,
        limitReached: true,
      },
      null,
    );
  }

  return null;
}
