import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { safeCreateBusinessNotification } from "@/modules/notifications/services/notifications.service.js";
import { assertSubscriptionResourceAvailable } from "@/modules/businesses-app/subscription/services/subscription-limits.service.js";
import {
  getPermissionSummaryService,
  getRolePermissionsService,
} from "@/modules/businesses-app/permissions/services/permissions.service.js";
import { mapBusinessUser } from "../helpers/business-user.mapper.js";
import type {
  BusinessUserListFilters,
  BusinessUserListItem,
  BusinessUserPermissionPayload,
  BusinessUserPermissionsResponse,
  BusinessUserRow,
  ChangeBusinessUserRolePayload,
  ChangeBusinessUserStatusPayload,
  CreateBusinessUserPayload,
  PaginatedBusinessUsersResponse,
  TotalRow,
  UpdateBusinessUserPayload,
  UpdateBusinessUserPermissionsPayload,
} from "../types/index.js";

interface SqlErrorLike {
  code?: string;
  sqlMessage?: string;
  message?: string;
}

function getTotalPages(totalRecords: number, limit: number): number {
  return Math.max(Math.ceil(totalRecords / limit), 1);
}

function mapSqlError(error: unknown): never {
  const sqlError = error as SqlErrorLike;
  const message = sqlError.sqlMessage || sqlError.message || "Error de usuarios";

  if (sqlError.code === "ER_DUP_ENTRY") {
    throw new Error("BUSINESS_USER_ALREADY_EXISTS");
  }

  throw new Error(message);
}

function normalizeOverrides(
  rolePermissions: string[],
  permissions: BusinessUserPermissionPayload[],
): BusinessUserPermissionPayload[] {
  return permissions.filter(function filterOverride(permission) {
    const roleHasPermission = rolePermissions.includes(permission.code);
    if (permission.effect === "ALLOW" && roleHasPermission) return false;
    if (permission.effect === "DENY" && !roleHasPermission) return false;
    return true;
  });
}

function toJsonPermissions(permissions: BusinessUserPermissionPayload[]): string {
  return JSON.stringify(permissions);
}

export async function listBusinessUsersService(
  idBusiness: number,
  filters: BusinessUserListFilters,
): Promise<PaginatedBusinessUsersResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_user_list(?, ?, ?, ?, ?, ?)",
    [
      idBusiness,
      filters.search || null,
      filters.role || null,
      filters.status || null,
      filters.limit,
      filters.offset,
    ],
  );
  const result = rows as unknown as [BusinessUserRow[], TotalRow[]];
  const records = (result[0] ?? []).map(mapBusinessUser);
  const totalRecords = result[1]?.[0]?.totalRecords ?? 0;

  return {
    users: records,
    pagination: {
      totalRecords,
      currentPage: filters.page,
      totalPages: getTotalPages(totalRecords, filters.limit),
      limit: filters.limit,
    },
  };
}

export async function getBusinessUserByIdService(
  idBusiness: number,
  idUser: number,
): Promise<BusinessUserListItem> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_user_get_by_id(?, ?)",
    [idBusiness, idUser],
  );
  const result = rows as unknown as BusinessUserRow[][];
  const user = result[0]?.[0];

  if (!user) {
    throw new Error("BUSINESS_USER_NOT_FOUND");
  }

  return mapBusinessUser(user);
}

export async function createBusinessUserService(
  payload: CreateBusinessUserPayload,
): Promise<BusinessUserListItem> {
  await assertSubscriptionResourceAvailable(payload.idBusiness, "USERS", 1);

  const rolePermissions = await getRolePermissionsService(payload.role);
  const normalizedPermissions = normalizeOverrides(
    rolePermissions,
    payload.permissions ?? [],
  );
  const passwordHash = await bcrypt.hash(payload.password, 10);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_user_create(?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?)",
      [
        payload.idBusiness,
        payload.name,
        payload.username,
        payload.email ?? null,
        passwordHash,
        payload.role,
        toJsonPermissions(normalizedPermissions),
        payload.actorUserId,
      ],
    );
    const result = rows as unknown as BusinessUserRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw new Error("No se pudo crear el usuario");
    }

    const mappedUser = mapBusinessUser(user);

    await safeCreateBusinessNotification({
      idBusiness: payload.idBusiness,
      type: "BUSINESS_USER_CREATED",
      severity: "INFO",
      title: "Nuevo usuario creado",
      message: `Se creo el usuario ${mappedUser.name} con rol ${mappedUser.role}.`,
      actionUrl: "/admin/business-users",
      metadata: {
        idUser: mappedUser.idUser,
        username: mappedUser.username,
        role: mappedUser.role,
      },
      roles: ["OWNER"],
      createdByUserId: payload.actorUserId,
    });

    return mappedUser;
  } catch (error: unknown) {
    mapSqlError(error);
  }
}

export async function updateBusinessUserService(
  payload: UpdateBusinessUserPayload,
): Promise<BusinessUserListItem> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_user_update(?, ?, ?, ?, ?)",
      [
        payload.idBusiness,
        payload.idUser,
        payload.name,
        payload.username,
        payload.email ?? null,
      ],
    );
    const result = rows as unknown as BusinessUserRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw new Error("BUSINESS_USER_NOT_FOUND");
    }

    return mapBusinessUser(user);
  } catch (error: unknown) {
    mapSqlError(error);
  }
}

export async function changeBusinessUserRoleService(
  payload: ChangeBusinessUserRolePayload,
): Promise<BusinessUserListItem> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_user_change_role(?, ?, ?)",
      [payload.idBusiness, payload.idUser, payload.role],
    );
    const result = rows as unknown as BusinessUserRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw new Error("BUSINESS_USER_NOT_FOUND");
    }

    return mapBusinessUser(user);
  } catch (error: unknown) {
    mapSqlError(error);
  }
}

export async function changeBusinessUserStatusService(
  payload: ChangeBusinessUserStatusPayload,
): Promise<BusinessUserListItem> {
  if (payload.isActive) {
    await assertSubscriptionResourceAvailable(payload.idBusiness, "USERS", 1);
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_business_user_change_status(?, ?, ?, ?)",
      [
        payload.idBusiness,
        payload.idUser,
        payload.actorUserId,
        payload.isActive ? 1 : 0,
      ],
    );
    const result = rows as unknown as BusinessUserRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw new Error("BUSINESS_USER_NOT_FOUND");
    }

    const mappedUser = mapBusinessUser(user);

    if (!payload.isActive) {
      await safeCreateBusinessNotification({
        idBusiness: payload.idBusiness,
        type: "BUSINESS_USER_DEACTIVATED",
        severity: "WARNING",
        title: "Usuario desactivado",
        message: `Se desactivo el usuario ${mappedUser.name}.`,
        actionUrl: "/admin/business-users",
        metadata: {
          idUser: mappedUser.idUser,
          username: mappedUser.username,
          role: mappedUser.role,
        },
        roles: ["OWNER"],
        createdByUserId: payload.actorUserId,
      });
    }

    return mappedUser;
  } catch (error: unknown) {
    mapSqlError(error);
  }
}

export async function getBusinessUserPermissionsService(
  idBusiness: number,
  idUser: number,
): Promise<BusinessUserPermissionsResponse> {
  return getPermissionSummaryService(idBusiness, idUser);
}

export async function updateBusinessUserPermissionsService(
  payload: UpdateBusinessUserPermissionsPayload,
): Promise<BusinessUserPermissionsResponse> {
  const targetUser = await getBusinessUserByIdService(
    payload.idBusiness,
    payload.idUser,
  );

  if (targetUser.role === "OWNER") {
    throw new Error("CANNOT_MODIFY_OWNER");
  }

  const rolePermissions = await getRolePermissionsService(targetUser.role);
  const normalizedPermissions = normalizeOverrides(
    rolePermissions,
    payload.permissions,
  );

  try {
    await pool.query<RowDataPacket[]>(
      "CALL sp_business_user_set_permission_overrides(?, ?, CAST(? AS JSON), ?)",
      [
        payload.idBusiness,
        payload.idUser,
        toJsonPermissions(normalizedPermissions),
        payload.actorUserId,
      ],
    );

    return getPermissionSummaryService(payload.idBusiness, payload.idUser);
  } catch (error: unknown) {
    mapSqlError(error);
  }
}

export async function resetBusinessUserPermissionsService(
  idBusiness: number,
  idUser: number,
): Promise<BusinessUserPermissionsResponse> {
  try {
    await pool.query<RowDataPacket[]>(
      "CALL sp_business_user_reset_permission_overrides(?, ?)",
      [idBusiness, idUser],
    );

    return getPermissionSummaryService(idBusiness, idUser);
  } catch (error: unknown) {
    mapSqlError(error);
  }
}
