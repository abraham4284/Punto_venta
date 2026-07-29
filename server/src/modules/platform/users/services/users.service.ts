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
import type {
  ChangePlatformUserRoleBody,
  ChangePlatformUserStatusBody,
  CreatePlatformUserAdminBody,
  PlatformUserAdminResponse,
  PlatformUserAdminRow,
  PlatformUserListQuery,
  RevokePlatformUserSessionsBody,
  TotalRow,
} from "../types/index.js";

function mapPlatformUser(row: PlatformUserAdminRow): PlatformUserAdminResponse {
  return {
    idPlatformUser: row.idPlatformUser,
    idUser: row.idUser,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
    activeSessions: Number(row.activeSessions ?? 0),
  };
}

export async function listPlatformUsersService(
  query: PlatformUserListQuery,
  pagination: PaginationParams,
): Promise<PaginatedResponse<PlatformUserAdminResponse>> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_users_list(?, ?, ?, ?, ?)",
      [
        query.search ?? null,
        query.role ?? null,
        query.isActive === undefined ? null : Number(query.isActive),
        pagination.limit,
        pagination.offset,
      ],
    );
    const result = rows as unknown as [PlatformUserAdminRow[], TotalRow[]];
    const totalRecords = result[1]?.[0]?.totalRecords ?? 0;

    return buildPaginatedResponse(
      result[0].map(mapPlatformUser),
      totalRecords,
      pagination,
    );
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function getPlatformUserByIdService(
  idPlatformUser: number,
): Promise<PlatformUserAdminResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_users_get_by_id(?)",
      [idPlatformUser],
    );
    const result = rows as unknown as PlatformUserAdminRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw createPlatformModuleError(
        "Usuario de plataforma no encontrado",
        404,
        "PLATFORM_USER_NOT_FOUND",
      );
    }

    return mapPlatformUser(user);
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function createPlatformUserAdminService(
  data: CreatePlatformUserAdminBody,
  actorIdUser: number,
  ipAddress?: string,
  userAgent?: string,
): Promise<PlatformUserAdminResponse> {
  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_users_create(?, ?, ?, ?, ?)",
      [
        data.name,
        data.username,
        data.email ?? null,
        passwordHash,
        data.platformRole,
      ],
    );
    const result = rows as unknown as PlatformUserAdminRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw createPlatformModuleError(
        "No se pudo crear el usuario de plataforma",
        400,
        "PLATFORM_USER_CREATE_FAILED",
      );
    }

    const mappedUser = mapPlatformUser(user);

    await createPlatformAuditLogService({
      actorIdUser,
      action: "PLATFORM_USER_CREATED",
      entityType: "PLATFORM_USER",
      entityId: mappedUser.idPlatformUser,
      newData: {
        ...mappedUser,
        password: undefined,
      },
      ipAddress,
      userAgent,
    });

    return mappedUser;
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function changePlatformUserRoleService(
  idPlatformUser: number,
  data: ChangePlatformUserRoleBody,
  actorIdUser: number,
  ipAddress?: string,
  userAgent?: string,
): Promise<PlatformUserAdminResponse> {
  const previousData = await getPlatformUserByIdService(idPlatformUser);

  if (previousData.idUser === actorIdUser && previousData.role === "SUPER_ADMIN" && data.platformRole !== "SUPER_ADMIN") {
    throw createPlatformModuleError(
      "No puedes degradar tu propio usuario SUPER_ADMIN",
      409,
      "CANNOT_DEMOTE_SELF",
    );
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_users_change_role(?, ?)",
      [idPlatformUser, data.platformRole],
    );
    const result = rows as unknown as PlatformUserAdminRow[][];
    const updatedUser = mapPlatformUser(result[0][0]);

    await createPlatformAuditLogService({
      actorIdUser,
      action: "PLATFORM_USER_ROLE_CHANGED",
      entityType: "PLATFORM_USER",
      entityId: idPlatformUser,
      previousData,
      newData: updatedUser,
      ipAddress,
      userAgent,
    });

    return updatedUser;
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function changePlatformUserStatusService(
  idPlatformUser: number,
  data: ChangePlatformUserStatusBody,
  actorIdUser: number,
  ipAddress?: string,
  userAgent?: string,
): Promise<PlatformUserAdminResponse> {
  const previousData = await getPlatformUserByIdService(idPlatformUser);

  if (previousData.idUser === actorIdUser && !data.isActive) {
    throw createPlatformModuleError(
      "No puedes desactivar tu propio usuario",
      409,
      "CANNOT_DEACTIVATE_SELF",
    );
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_users_change_status(?, ?)",
      [idPlatformUser, Number(data.isActive)],
    );
    const result = rows as unknown as PlatformUserAdminRow[][];
    const updatedUser = mapPlatformUser(result[0][0]);

    await createPlatformAuditLogService({
      actorIdUser,
      action: "PLATFORM_USER_STATUS_CHANGED",
      entityType: "PLATFORM_USER",
      entityId: idPlatformUser,
      previousData,
      newData: updatedUser,
      metadata: { reason: data.reason },
      ipAddress,
      userAgent,
    });

    return updatedUser;
  } catch (error) {
    mapPlatformSqlError(error);
  }
}

export async function revokePlatformUserSessionsService(
  idPlatformUser: number,
  data: RevokePlatformUserSessionsBody,
  actorIdUser: number,
  ipAddress?: string,
  userAgent?: string,
) {
  const previousData = await getPlatformUserByIdService(idPlatformUser);

  if (previousData.idUser === actorIdUser) {
    throw createPlatformModuleError(
      "No puedes revocar tus propias sesiones desde esta accion",
      409,
      "CANNOT_REVOKE_SELF_SESSIONS",
    );
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_users_revoke_sessions(?, ?)",
      [idPlatformUser, null],
    );
    const result = rows as unknown as Array<Array<{ revokedSessions: number }>>;
    const revokedSessions = result[0]?.[0]?.revokedSessions ?? 0;

    await createPlatformAuditLogService({
      actorIdUser,
      action: "PLATFORM_USER_SESSIONS_REVOKED",
      entityType: "PLATFORM_USER",
      entityId: idPlatformUser,
      previousData,
      metadata: { reason: data.reason, revokedSessions },
      ipAddress,
      userAgent,
    });

    return { revokedSessions };
  } catch (error) {
    mapPlatformSqlError(error);
  }
}
