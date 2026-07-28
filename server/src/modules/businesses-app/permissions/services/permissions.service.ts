import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import type { BusinessRole } from "@/types/auth.types.js";
import {
  mapPermission,
  mapPermissionOverride,
} from "../helpers/permission.mapper.js";
import type {
  GroupedPermissionsResponse,
  PermissionCodeRow,
  PermissionOverrideRow,
  PermissionResponse,
  PermissionRow,
  PermissionSummary,
  UserPermissionOverride,
} from "../types/index.js";

interface BusinessUserRoleRow extends RowDataPacket {
  role: BusinessRole;
}

export async function getPermissionsCatalogService(): Promise<
  PermissionResponse[]
> {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_permission_catalog()");
  const result = rows as unknown as PermissionRow[][];

  return (result[0] ?? []).map(mapPermission);
}

export async function getGroupedPermissionsService(): Promise<
  GroupedPermissionsResponse[]
> {
  const permissions = await getPermissionsCatalogService();
  const grouped = permissions.reduce<Map<string, PermissionResponse[]>>(
    function groupPermissions(acc, permission) {
      const current = acc.get(permission.module) ?? [];
      current.push(permission);
      acc.set(permission.module, current);
      return acc;
    },
    new Map<string, PermissionResponse[]>(),
  );

  return Array.from(grouped.entries()).map(function mapGroup([
    module,
    modulePermissions,
  ]) {
    return {
      module,
      permissions: modulePermissions,
    };
  });
}

export async function getBusinessUserRoleService(
  idBusiness: number,
  idUser: number,
): Promise<BusinessRole> {
  const [rows] = await pool.query<BusinessUserRoleRow[]>(
    `SELECT bu.role
     FROM business_users bu
     INNER JOIN users u ON u.idUser = bu.idUser
     WHERE bu.idBusiness = ?
       AND bu.idUser = ?
       AND bu.is_active = 1
       AND u.is_active = 1
     LIMIT 1`,
    [idBusiness, idUser],
  );

  const role = rows[0]?.role;

  if (!role) {
    throw new Error("BUSINESS_USER_NOT_FOUND");
  }

  return role;
}

export async function getRolePermissionsService(
  role: BusinessRole,
): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_user_role_permissions(?)",
    [role],
  );
  const result = rows as unknown as PermissionCodeRow[][];

  return (result[0] ?? []).map(function mapCode(row) {
    return row.code;
  });
}

export async function getUserPermissionOverridesService(
  idBusiness: number,
  idUser: number,
): Promise<UserPermissionOverride[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_user_permission_overrides(?, ?)",
    [idBusiness, idUser],
  );
  const result = rows as unknown as PermissionOverrideRow[][];

  return (result[0] ?? []).map(mapPermissionOverride);
}

export async function getEffectivePermissionsService(
  idBusiness: number,
  idUser: number,
): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_business_user_effective_permissions(?, ?)",
    [idBusiness, idUser],
  );
  const result = rows as unknown as PermissionCodeRow[][];

  return (result[0] ?? []).map(function mapCode(row) {
    return row.code;
  });
}

export async function userHasPermissionService(
  idBusiness: number,
  idUser: number,
  permissionCode: string,
): Promise<boolean> {
  const role = await getBusinessUserRoleService(idBusiness, idUser);

  if (role === "OWNER") {
    return true;
  }

  const permissions = await getEffectivePermissionsService(idBusiness, idUser);
  return permissions.includes(permissionCode);
}

export async function getPermissionSummaryService(
  idBusiness: number,
  idUser: number,
): Promise<PermissionSummary> {
  const role = await getBusinessUserRoleService(idBusiness, idUser);
  const [rolePermissions, overrides, effectivePermissions] = await Promise.all([
    getRolePermissionsService(role),
    getUserPermissionOverridesService(idBusiness, idUser),
    getEffectivePermissionsService(idBusiness, idUser),
  ]);

  return {
    role,
    rolePermissions,
    overrides,
    effectivePermissions,
  };
}
