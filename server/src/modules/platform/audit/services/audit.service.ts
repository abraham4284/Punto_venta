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
import type {
  CreatePlatformAuditLogInput,
  PlatformAuditListQuery,
  PlatformAuditLogResponse,
  PlatformAuditLogRow,
  PlatformUserLookupRow,
  TotalRow,
} from "../types/index.js";

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value ?? null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stringifyJsonValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

function mapAuditLog(row: PlatformAuditLogRow): PlatformAuditLogResponse {
  return {
    idPlatformAuditLog: row.idPlatformAuditLog,
    actor: {
      idPlatformUser: row.idPlatformUser,
      name: row.platformUserName,
      username: row.platformUsername,
      role: row.platformRole,
    },
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    business: {
      idBusiness: row.idBusiness,
      name: row.businessName,
    },
    previousData: parseJsonValue(row.previousData),
    newData: parseJsonValue(row.newData),
    metadata: parseJsonValue(row.metadata),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };
}

export async function getPlatformUserIdByUserIdService(
  idUser: number,
): Promise<number> {
  const [rows] = await pool.query<PlatformUserLookupRow[]>(
    "SELECT idPlatformUser FROM platform_users WHERE idUser = ? LIMIT 1",
    [idUser],
  );
  const platformUser = rows[0];

  if (!platformUser) {
    throw createPlatformModuleError(
      "Usuario de plataforma no encontrado",
      404,
      "PLATFORM_USER_NOT_FOUND",
    );
  }

  return platformUser.idPlatformUser;
}

export async function createPlatformAuditLogService(
  input: CreatePlatformAuditLogInput,
): Promise<PlatformAuditLogResponse | null> {
  try {
    const idPlatformUser = await getPlatformUserIdByUserIdService(input.actorIdUser);
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_audit_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        idPlatformUser,
        input.action,
        input.entityType,
        input.entityId === undefined || input.entityId === null
          ? null
          : String(input.entityId),
        input.idBusiness ?? null,
        stringifyJsonValue(input.previousData),
        stringifyJsonValue(input.newData),
        stringifyJsonValue(input.metadata),
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ],
    );
    const result = rows as unknown as PlatformAuditLogRow[][];
    const auditLog = result[0]?.[0];

    return auditLog ? mapAuditLog(auditLog) : null;
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function listPlatformAuditLogsService(
  query: PlatformAuditListQuery,
  pagination: PaginationParams,
): Promise<PaginatedResponse<PlatformAuditLogResponse>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_audit_list(?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        query.platformUserId ?? null,
        query.action ?? null,
        query.entityType ?? null,
        query.entityId ?? null,
        query.idBusiness ?? null,
        query.dateFrom ?? null,
        query.dateTo ?? null,
        pagination.limit,
        pagination.offset,
      ],
    );
    const result = rows as unknown as [PlatformAuditLogRow[], TotalRow[]];
    const totalRecords = result[1]?.[0]?.totalRecords ?? 0;

    return buildPaginatedResponse(
      result[0].map(mapAuditLog),
      totalRecords,
      pagination,
    );
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function getPlatformAuditLogByIdService(
  idPlatformAuditLog: number,
): Promise<PlatformAuditLogResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_audit_get_by_id(?)",
      [idPlatformAuditLog],
    );
    const result = rows as unknown as PlatformAuditLogRow[][];
    const auditLog = result[0]?.[0];

    if (!auditLog) {
      throw createPlatformModuleError(
        "Registro de auditoria no encontrado",
        404,
        "PLATFORM_AUDIT_LOG_NOT_FOUND",
      );
    }

    return mapAuditLog(auditLog);
  } catch (error) {
    mapPlatformSqlError(error);
  }
}
