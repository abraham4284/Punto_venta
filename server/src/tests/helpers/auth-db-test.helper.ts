import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import type { BusinessRole, PlatformRole } from "@/types/auth.types.js";
import {
  executeInsert,
  executeMutation,
  querySingleRow,
} from "@/tests/helpers/test-database.helper.js";

interface UserSessionRow extends RowDataPacket {
  idLogin: number;
  idUser: number;
  idBusiness: number | null;
  auth_context: "BUSINESS" | "PLATFORM";
  revoked_at: Date | null;
  refresh_token_hash: string | null;
}

interface UserSecurityRow extends RowDataPacket {
  idUser: number;
  password_hash: string;
  must_change_password: number;
  is_active: number;
}

interface PermissionRow extends RowDataPacket {
  idPermission: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface BusinessUserRoleRow extends RowDataPacket {
  role: BusinessRole;
}

interface PlatformUserRoleRow extends RowDataPacket {
  role: PlatformRole;
}

interface BusinessSubscriptionRow extends RowDataPacket {
  idBusinessSubscription: number;
  status: string;
  grace_period_ends_at: Date | null;
  suspension_reason: string | null;
}

export async function getUserSessionByIdLogin(
  idLogin: number,
): Promise<UserSessionRow | null> {
  return querySingleRow<UserSessionRow>(
    `SELECT idLogin, idUser, idBusiness, auth_context, revoked_at, refresh_token_hash
     FROM user_sessions
     WHERE idLogin = ?
     LIMIT 1`,
    [idLogin],
  );
}

export async function getLatestSessionForUser(
  idUser: number,
): Promise<UserSessionRow | null> {
  return querySingleRow<UserSessionRow>(
    `SELECT idLogin, idUser, idBusiness, auth_context, revoked_at, refresh_token_hash
     FROM user_sessions
     WHERE idUser = ?
     ORDER BY idLogin DESC
     LIMIT 1`,
    [idUser],
  );
}

export async function revokeSessionByIdLogin(idLogin: number): Promise<void> {
  await executeMutation(
    "UPDATE user_sessions SET revoked_at = NOW() WHERE idLogin = ?",
    [idLogin],
  );
}

export async function getUserSecurityById(
  idUser: number,
): Promise<UserSecurityRow | null> {
  return querySingleRow<UserSecurityRow>(
    `SELECT idUser, password_hash, must_change_password, is_active
     FROM users
     WHERE idUser = ?
     LIMIT 1`,
    [idUser],
  );
}

export async function passwordMatchesUserHash(
  idUser: number,
  password: string,
): Promise<boolean> {
  const user = await getUserSecurityById(idUser);

  if (!user) {
    throw new Error("Usuario de prueba no encontrado");
  }

  return bcrypt.compare(password, user.password_hash);
}

export async function setUserActiveState(
  idUser: number,
  isActive: boolean,
): Promise<void> {
  await executeMutation("UPDATE users SET is_active = ? WHERE idUser = ?", [
    isActive ? 1 : 0,
    idUser,
  ]);
}

export async function setUserMustChangePassword(
  idUser: number,
  mustChangePassword: boolean,
): Promise<void> {
  await executeMutation(
    "UPDATE users SET must_change_password = ? WHERE idUser = ?",
    [mustChangePassword ? 1 : 0, idUser],
  );
}

export async function setBusinessUserActiveState(input: {
  idBusiness: number;
  idUser: number;
  isActive: boolean;
}): Promise<void> {
  await executeMutation(
    "UPDATE business_users SET is_active = ? WHERE idBusiness = ? AND idUser = ?",
    [input.isActive ? 1 : 0, input.idBusiness, input.idUser],
  );
}

export async function setBusinessActiveState(
  idBusiness: number,
  isActive: boolean,
): Promise<void> {
  await executeMutation("UPDATE businesses SET is_active = ? WHERE idBusiness = ?", [
    isActive ? 1 : 0,
    idBusiness,
  ]);
}

export async function setPlatformUserActiveState(input: {
  idUser: number;
  isActive: boolean;
}): Promise<void> {
  await executeMutation("UPDATE platform_users SET is_active = ? WHERE idUser = ?", [
    input.isActive ? 1 : 0,
    input.idUser,
  ]);
}

export async function getPermissionIdByCode(code: string): Promise<number> {
  const permission = await querySingleRow<PermissionRow>(
    "SELECT idPermission FROM permissions WHERE code = ? LIMIT 1",
    [code],
  );

  if (!permission) {
    throw new Error(`No existe el permiso requerido para test: ${code}`);
  }

  return permission.idPermission;
}

export async function setBusinessUserPermissionOverride(input: {
  idBusiness: number;
  idUser: number;
  permissionCode: string;
  effect: "ALLOW" | "DENY";
  createdByUserId: number;
}): Promise<void> {
  const idPermission = await getPermissionIdByCode(input.permissionCode);

  await executeMutation(
    `INSERT INTO business_user_permissions
      (idBusiness, idUser, idPermission, effect, created_by_user_id)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       effect = VALUES(effect),
       created_by_user_id = VALUES(created_by_user_id),
       updated_at = NOW()`,
    [
      input.idBusiness,
      input.idUser,
      idPermission,
      input.effect,
      input.createdByUserId,
    ],
  );
}

export async function clearBusinessUserPermissionOverrides(input: {
  idBusiness: number;
  idUser: number;
}): Promise<void> {
  await executeMutation(
    "DELETE FROM business_user_permissions WHERE idBusiness = ? AND idUser = ?",
    [input.idBusiness, input.idUser],
  );
}

export async function countRowsBySql(
  sql: string,
  values: unknown[] = [],
): Promise<number> {
  const row = await querySingleRow<CountRow>(sql, values);
  return Number(row?.total ?? 0);
}

export async function getBusinessUserRole(input: {
  idBusiness: number;
  idUser: number;
}): Promise<BusinessRole | null> {
  const row = await querySingleRow<BusinessUserRoleRow>(
    "SELECT role FROM business_users WHERE idBusiness = ? AND idUser = ? LIMIT 1",
    [input.idBusiness, input.idUser],
  );
  return row?.role ?? null;
}

export async function getPlatformUserRole(
  idUser: number,
): Promise<PlatformRole | null> {
  const row = await querySingleRow<PlatformUserRoleRow>(
    "SELECT role FROM platform_users WHERE idUser = ? LIMIT 1",
    [idUser],
  );
  return row?.role ?? null;
}

export async function getBusinessSubscription(
  idBusiness: number,
): Promise<BusinessSubscriptionRow | null> {
  return querySingleRow<BusinessSubscriptionRow>(
    `SELECT idBusinessSubscription, status, grace_period_ends_at, suspension_reason
     FROM business_subscriptions
     WHERE idBusiness = ?
     ORDER BY idBusinessSubscription DESC
     LIMIT 1`,
    [idBusiness],
  );
}

export async function updateBusinessSubscriptionState(input: {
  idBusiness: number;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  gracePeriodEndsAt?: string | null;
}): Promise<void> {
  await executeMutation(
    `UPDATE business_subscriptions
     SET status = ?,
         grace_period_ends_at = ?,
         suspended_at = CASE WHEN ? = 'SUSPENDED' THEN NOW() ELSE suspended_at END,
         expired_at = CASE WHEN ? = 'EXPIRED' THEN NOW() ELSE expired_at END,
         cancelled_at = CASE WHEN ? = 'CANCELLED' THEN NOW() ELSE cancelled_at END
     WHERE idBusiness = ?`,
    [
      input.status,
      input.gracePeriodEndsAt ?? null,
      input.status,
      input.status,
      input.status,
      input.idBusiness,
    ],
  );
}

export async function createPermissionEffectFixture(input: {
  idBusiness: number;
  idUser: number;
  permissionCode: string;
  effect: "ALLOW" | "DENY";
  createdByUserId: number;
}): Promise<number> {
  const idPermission = await getPermissionIdByCode(input.permissionCode);

  return executeInsert(
    `INSERT INTO business_user_permissions
      (idBusiness, idUser, idPermission, effect, created_by_user_id)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.idBusiness,
      input.idUser,
      idPermission,
      input.effect,
      input.createdByUserId,
    ],
  );
}
