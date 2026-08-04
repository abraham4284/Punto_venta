import { Decimal } from "decimal.js";
import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import {
  buildPaginatedResponse,
  type PaginatedResponse,
  type PaginationParams,
} from "../../helpers/pagination.helper.js";
import {
  createPlatformModuleError,
  mapPlatformSqlError,
} from "../../helpers/platform-error.helper.js";
import { createPlatformAuditLogService } from "../../audit/services/audit.service.js";
import { generateTemporaryPassword } from "../helpers/temporary-password.helper.js";
import type {
  PlatformBusinessActivityRow,
  PlatformBusinessListQuery,
  PlatformBusinessPurchaseRow,
  PlatformBusinessRow,
  PlatformBusinessSaleRow,
  PlatformBusinessStatusBody,
  PlatformBusinessUsageRow,
  PlatformBusinessUserPasswordResetRow,
  PlatformBusinessUserRow,
  ResetBusinessUserPasswordBody,
  TotalRow,
} from "../types/index.js";

function numberValue(value: string | number | null | undefined): number {
  return new Decimal(value ?? 0).toNumber();
}

function usageMetric(current: number, limit: number | null) {
  const percentage =
    limit === null || limit === 0
      ? null
      : new Decimal(current).div(limit).mul(100).toDecimalPlaces(2).toNumber();

  return {
    current,
    limit,
    percentage,
    reached: limit !== null && current >= limit,
    exceeded: limit !== null && current > limit,
  };
}

function mapBusinessListItem(row: PlatformBusinessRow) {
  return {
    idBusiness: row.idBusiness,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    businessType: row.businessType,
    isActive: Boolean(row.isActive),
    businessStatus: row.businessStatus,
    owner: {
      idUser: row.ownerIdUser,
      name: row.ownerName,
      username: row.ownerUsername,
      email: row.ownerEmail,
    },
    subscription: {
      idBusinessSubscription: row.idBusinessSubscription,
      planName: row.planName,
      planCode: row.planCode,
      status: row.subscriptionStatus,
      startDate: row.startDate,
      endDate: row.endDate,
    },
    usage: {
      activeUsers: numberValue(row.activeUsers),
      products: numberValue(row.products),
      deposits: numberValue(row.deposits),
    },
    activity: {
      lastLoginAt: row.lastLoginAt,
      lastSaleAt: row.lastSaleAt,
      lastPurchaseAt: row.lastPurchaseAt,
      activityStatus: row.activityStatus,
    },
    createdAt: row.createdAt,
  };
}

function mapUsage(row: PlatformBusinessUsageRow) {
  return {
    users: usageMetric(numberValue(row.currentUsers), row.maxUsers),
    products: usageMetric(numberValue(row.currentProducts), row.maxProducts),
    deposits: usageMetric(numberValue(row.currentDeposits), row.maxDeposits),
    bulkImportEnabled: Boolean(row.bulkImportEnabled),
  };
}

export async function listPlatformBusinessesService(
  query: PlatformBusinessListQuery,
  pagination: PaginationParams,
): Promise<PaginatedResponse<ReturnType<typeof mapBusinessListItem>>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_list(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        query.search ?? null,
        query.businessStatus ?? null,
        query.subscriptionStatus ?? null,
        query.planId ?? null,
        query.businessType ?? null,
        query.activityStatus ?? null,
        query.createdFrom ?? null,
        query.createdTo ?? null,
        pagination.limit,
        pagination.offset,
      ],
    );
    const result = rows as unknown as [PlatformBusinessRow[], TotalRow[]];
    const totalRecords = result[1]?.[0]?.totalRecords ?? 0;

    return buildPaginatedResponse(
      result[0].map(mapBusinessListItem),
      totalRecords,
      pagination,
    );
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function getPlatformBusinessByIdService(idBusiness: number) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_get_by_id(?)",
      [idBusiness],
    );
    const result = rows as unknown as [
      PlatformBusinessRow[],
      PlatformBusinessActivityRow[],
      PlatformBusinessUsageRow[],
    ];
    const business = result[0]?.[0];

    if (!business) {
      throw createPlatformModuleError(
        "Negocio no encontrado",
        404,
        "PLATFORM_BUSINESS_NOT_FOUND",
      );
    }

    return {
      ...mapBusinessListItem(business),
      updatedAt: business.updatedAt ?? null,
      subscription: {
        ...mapBusinessListItem(business).subscription,
        idSubscriptionPlan: business.idSubscriptionPlan ?? null,
        billingPeriod: business.billingPeriod ?? null,
        startsAt: business.startsAt ?? null,
        trialEndsAt: business.trialEndsAt ?? null,
        currentPeriodStart: business.currentPeriodStart ?? null,
        currentPeriodEnd: business.currentPeriodEnd ?? null,
        autoRenew: Boolean(business.autoRenew),
        limits: {
          users: business.maxUsers ?? null,
          products: business.maxProducts ?? null,
          deposits: business.maxDeposits ?? null,
        },
      },
      activity: result[1]?.[0] ?? null,
      usage: result[2]?.[0] ? mapUsage(result[2][0]) : null,
    };
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function listPlatformBusinessUsersService(
  idBusiness: number,
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_users(?)",
      [idBusiness],
    );
    const result = rows as unknown as PlatformBusinessUserRow[][];

    return (result[0] ?? []).map(function mapUser(row) {
      return {
        idUser: row.idUser,
        name: row.name,
        username: row.username,
        email: row.email,
        role: row.role,
        userIsActive: Boolean(row.userIsActive),
        membershipIsActive: Boolean(row.membershipIsActive),
        effectiveIsActive: Boolean(row.effectiveIsActive),
        mustChangePassword: Boolean(row.mustChangePassword),
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt,
      };
    });
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function getPlatformBusinessActivityService(idBusiness: number) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_activity(?)",
      [idBusiness],
    );
    const result = rows as unknown as PlatformBusinessActivityRow[][];
    return result[0]?.[0] ?? null;
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function getPlatformBusinessUsageService(idBusiness: number) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_usage(?)",
      [idBusiness],
    );
    const result = rows as unknown as PlatformBusinessUsageRow[][];
    const usage = result[0]?.[0];

    if (!usage) {
      throw createPlatformModuleError(
        "Negocio no encontrado",
        404,
        "PLATFORM_BUSINESS_NOT_FOUND",
      );
    }

    return mapUsage(usage);
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function listPlatformBusinessRecentSalesService(idBusiness: number) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_recent_sales(?, ?)",
      [idBusiness, 10],
    );
    const result = rows as unknown as PlatformBusinessSaleRow[][];

    return (result[0] ?? []).map(function mapSale(row) {
      return {
        ...row,
        total: numberValue(row.total),
      };
    });
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function listPlatformBusinessRecentPurchasesService(
  idBusiness: number,
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_recent_purchases(?, ?)",
      [idBusiness, 10],
    );
    const result = rows as unknown as PlatformBusinessPurchaseRow[][];

    return (result[0] ?? []).map(function mapPurchase(row) {
      return {
        ...row,
        total: numberValue(row.total),
      };
    });
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function changePlatformBusinessStatusService(
  idBusiness: number,
  data: PlatformBusinessStatusBody,
  actorIdUser: number,
  ipAddress?: string,
  userAgent?: string,
) {
  const previousData = await getPlatformBusinessByIdService(idBusiness);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_change_status(?, ?)",
      [idBusiness, Number(data.isActive)],
    );
    const result = rows as unknown as PlatformBusinessRow[][];
    const updatedBusiness = result[0]?.[0]
      ? mapBusinessListItem(result[0][0])
      : await getPlatformBusinessByIdService(idBusiness);

    await createPlatformAuditLogService({
      actorIdUser,
      action: "BUSINESS_STATUS_CHANGED",
      entityType: "BUSINESS",
      entityId: idBusiness,
      idBusiness,
      previousData,
      newData: updatedBusiness,
      metadata: { reason: data.reason, isActive: data.isActive },
      ipAddress,
      userAgent,
    });

    return updatedBusiness;
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function resetPlatformBusinessUserPasswordService(
  idBusiness: number,
  idUser: number,
  data: ResetBusinessUserPasswordBody,
  actorIdUser: number,
  ipAddress?: string,
  userAgent?: string,
) {
  const temporaryPassword = generateTemporaryPassword();
  const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_business_user_reset_password(?, ?, ?, ?)",
      [idBusiness, idUser, temporaryPasswordHash, actorIdUser],
    );
    const result = rows as unknown as PlatformBusinessUserPasswordResetRow[][];
    const resetUser = result[0]?.[0];

    if (!resetUser) {
      throw createPlatformModuleError(
        "No se pudo restablecer la contrasena del usuario",
        409,
        "BUSINESS_USER_PASSWORD_RESET_FAILED",
      );
    }

    await createPlatformAuditLogService({
      actorIdUser,
      action: "BUSINESS_USER_TEMPORARY_PASSWORD_ASSIGNED",
      entityType: "BUSINESS_USER",
      entityId: idUser,
      idBusiness,
      previousData: null,
      newData: {
        idBusiness: resetUser.idBusiness,
        idUser: resetUser.idUser,
        username: resetUser.username,
        role: resetUser.role,
        mustChangePassword: Boolean(resetUser.mustChangePassword),
      },
      metadata: {
        mode: data.mode,
        sessionsRevoked: numberValue(resetUser.sessionsRevoked),
      },
      ipAddress,
      userAgent,
    });

    return {
      user: {
        idBusiness: resetUser.idBusiness,
        idUser: resetUser.idUser,
        name: resetUser.name,
        username: resetUser.username,
        email: resetUser.email,
        role: resetUser.role,
        mustChangePassword: Boolean(resetUser.mustChangePassword),
      },
      temporaryPassword,
      sessionsRevoked: numberValue(resetUser.sessionsRevoked),
    };
  } catch (error) {
    mapPlatformSqlError(error);
  }
}
