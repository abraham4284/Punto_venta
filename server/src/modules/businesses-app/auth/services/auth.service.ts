import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { createAppError } from "@/helpers/app-error.helper.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/libs/tokens.js";
import { getLegalDocumentsUnavailableMessage } from "../../legal/services/legal.service.js";
import { getEffectivePermissionsService } from "../../permissions/services/permissions.service.js";
import type {
  AuthUser,
  AuthenticatedUserContext,
  AuthenticatedUserContextDbRow,
  BusinessSessionUser,
  LoginBody,
  RegisterBody,
  RegisterDbRow,
  LoginDbRow,
  SessionDbRow,
  UserInfoDbRow,
  UserInfoResponse,
  UserPasswordHashRow,
} from "../types/auth.types.js";

const REFRESH_DAYS = 7;
const INVALID_LOGIN_MESSAGE = "Usuario o contraseña incorrectos";

function createInvalidLoginError() {
  return createAppError({
    statusCode: 401,
    code: "INVALID_LOGIN_CREDENTIALS",
    message: INVALID_LOGIN_MESSAGE,
  });
}

function createRegisterDatabaseError(error: unknown): unknown {
  const candidate = error as Error & { sqlMessage?: string; sqlState?: string };

  if (candidate.sqlState !== "45000") {
    return error;
  }

  const message = candidate.sqlMessage ?? candidate.message;

  if (message === "LEGAL_DOCUMENT_NOT_AVAILABLE") {
    return createAppError({
      statusCode: 400,
      code: "LEGAL_DOCUMENT_NOT_AVAILABLE",
      message: getLegalDocumentsUnavailableMessage(),
    });
  }

  if (message === "LEGAL_TERMS_ACCEPTANCE_REQUIRED") {
    return createAppError({
      statusCode: 400,
      code: "LEGAL_TERMS_ACCEPTANCE_REQUIRED",
      message: "Debe aceptar los terminos y condiciones para crear la cuenta",
    });
  }

  if (message === "LEGAL_PRIVACY_ACKNOWLEDGEMENT_REQUIRED") {
    return createAppError({
      statusCode: 400,
      code: "LEGAL_PRIVACY_ACKNOWLEDGEMENT_REQUIRED",
      message: "Debe reconocer la politica de privacidad para crear la cuenta",
    });
  }

  return error;
}

function getRefreshExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
  return expiresAt;
}

async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

function mapUserInfo(row: UserInfoDbRow): UserInfoResponse {
  return {
    idUser: row.idUser,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    isActive: Boolean(row.isActive),
    mustChangePassword: Boolean(row.mustChangePassword),
    createdAt: row.createdAt,
  };
}

function mapLoginSessionUser(
  row: LoginDbRow,
  permissions: string[],
): BusinessSessionUser {
  return {
    idUser: row.idUser,
    name: row.name,
    username: row.username,
    email: row.email,
    idBusiness: row.idBusiness,
    businessName: row.business_name,
    businessSlug: row.business_slug,
    businessType: row.business_type ?? null,
    logoUrl: row.logo_url ?? null,
    businessStatus: row.business_status,
    role: row.role,
    mustChangePassword: Boolean(row.mustChangePassword),
    permissions,
  };
}

function mapRegisterSessionUser(
  row: RegisterDbRow,
  permissions: string[],
): BusinessSessionUser {
  return {
    idUser: row.idUser,
    name: row.name,
    username: row.username,
    email: row.email,
    idBusiness: row.idBusiness,
    businessName: row.businessName,
    businessSlug: row.businessSlug,
    businessType: row.businessType,
    logoUrl: row.logoUrl,
    businessStatus: row.businessStatus,
    role: row.role,
    mustChangePassword: Boolean(row.mustChangePassword),
    permissions,
  };
}

function mapAuthenticatedSessionUser(
  row: AuthenticatedUserContextDbRow,
  permissions: string[],
): BusinessSessionUser {
  return {
    idUser: row.idUser,
    name: row.name,
    username: row.username,
    email: row.email,
    idBusiness: row.idBusiness,
    businessName: row.businessName,
    businessSlug: row.businessSlug,
    businessType: row.businessType,
    logoUrl: row.logoUrl,
    businessStatus: row.businessStatus,
    role: row.role,
    mustChangePassword: Boolean(row.mustChangePassword),
    permissions,
  };
}

async function getAuthenticatedUserContextRow(
  idUser: number,
  idBusiness: number,
): Promise<AuthenticatedUserContextDbRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       u.idUser,
       b.idBusiness,
       u.name,
       u.username,
       u.email,
       bu.role,
       b.name AS businessName,
       b.slug AS businessSlug,
       b.business_type AS businessType,
       b.logo_url AS logoUrl,
       b.status AS businessStatus,
       u.must_change_password AS mustChangePassword
     FROM users u
     INNER JOIN business_users bu
       ON bu.idUser = u.idUser
       AND bu.idBusiness = ?
     INNER JOIN businesses b
       ON b.idBusiness = bu.idBusiness
     WHERE u.idUser = ?
       AND b.idBusiness = ?
       AND u.is_active = 1
       AND bu.is_active = 1
       AND b.is_active = 1
     LIMIT 1`,
    [idBusiness, idUser, idBusiness],
  );

  return (rows as unknown as AuthenticatedUserContextDbRow[])[0] ?? null;
}

async function getPermissionsForUser(
  idBusiness: number,
  idUser: number,
): Promise<string[]> {
  return getEffectivePermissionsService(idBusiness, idUser);
}

export async function loginService(
  data: LoginBody,
  userAgent?: string,
  ip?: string,
) {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_user_login(?)", [
    data.username,
  ]);

  const result = rows as unknown as LoginDbRow[][];
  const user = result[0]?.[0];

  if (!user) {
    throw createInvalidLoginError();
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password_hash);

  if (!passwordMatch) {
    throw createInvalidLoginError();
  }

  const accessToken = signAccessToken({
    context: "BUSINESS",
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    businessRole: user.role,
  });

  const tempRefreshToken = signRefreshToken({
    context: "BUSINESS",
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    idLogin: 0,
  });

  const tempRefreshHash = await hashRefreshToken(tempRefreshToken);
  const expiresAt = getRefreshExpirationDate();

  const [sessionRows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_session(?, ?, ?, ?, ?, ?)",
    [
      tempRefreshHash,
      expiresAt,
      userAgent ?? null,
      ip ?? null,
      user.idUser,
      user.idBusiness,
    ],
  );

  const sessionResult = sessionRows as unknown as { idLogin: number }[][];
  const idLogin = sessionResult[0]?.[0]?.idLogin;

  if (!idLogin) {
    throw new Error("No se pudo crear la sesión del usuario");
  }

  const refreshToken = signRefreshToken({
    context: "BUSINESS",
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    idLogin,
  });

  const refreshTokenHash = await hashRefreshToken(refreshToken);

  await pool.query(
    "UPDATE user_sessions SET refresh_token_hash = ? WHERE idLogin = ?",
    [refreshTokenHash, idLogin],
  );

  const permissions = await getPermissionsForUser(user.idBusiness, user.idUser);
  const contextRow =
    user.business_type !== undefined && user.logo_url !== undefined
      ? null
      : await getAuthenticatedUserContextRow(user.idUser, user.idBusiness);

  return {
    accessToken,
    refreshToken,
    user: contextRow
      ? mapAuthenticatedSessionUser(contextRow, permissions)
      : mapLoginSessionUser(user, permissions),
  };
}

export async function registerService(
  data: RegisterBody,
  userAgent?: string,
  ip?: string,
) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  let rows: RowDataPacket[];

  try {
    [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_user_register_with_business(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.name,
        data.username,
        data.email ?? null,
        passwordHash,
        data.businessName,
        data.businessSlug,
        data.businessType ?? "FINANCIERA",
        data.logoUrl ?? null,
        process.env.DEFAULT_TRIAL_PLAN_CODE ?? "BASIC_MONTHLY",
        data.acceptedTerms ? 1 : 0,
        data.acknowledgedPrivacy ? 1 : 0,
        ip ?? null,
        userAgent ? userAgent.slice(0, 500) : null,
      ],
    );
  } catch (error) {
    throw createRegisterDatabaseError(error);
  }

  const result = rows as unknown as RegisterDbRow[][];
  const user = result[0]?.[0];

  if (!user) {
    throw new Error("No se pudo registrar el usuario y negocio");
  }

  const accessToken = signAccessToken({
    context: "BUSINESS",
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    businessRole: user.role,
  });

  const tempRefreshToken = signRefreshToken({
    context: "BUSINESS",
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    idLogin: 0,
  });

  const tempRefreshHash = await hashRefreshToken(tempRefreshToken);
  const expiresAt = getRefreshExpirationDate();

  const [sessionRows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_session(?, ?, ?, ?, ?, ?)",
    [
      tempRefreshHash,
      expiresAt,
      userAgent ?? null,
      ip ?? null,
      user.idUser,
      user.idBusiness,
    ],
  );

  const sessionResult = sessionRows as unknown as { idLogin: number }[][];
  const idLogin = sessionResult[0]?.[0]?.idLogin;

  if (!idLogin) {
    throw new Error("No se pudo crear la sesion del usuario");
  }

  const refreshToken = signRefreshToken({
    context: "BUSINESS",
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    idLogin,
  });

  const refreshTokenHash = await hashRefreshToken(refreshToken);

  await pool.query(
    "UPDATE user_sessions SET refresh_token_hash = ? WHERE idLogin = ?",
    [refreshTokenHash, idLogin],
  );

  const permissions = await getPermissionsForUser(user.idBusiness, user.idUser);

  return {
    accessToken,
    refreshToken,
    user: mapRegisterSessionUser(user, permissions),
  };
}

export async function refreshTokenService(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);

    if (payload.context !== "BUSINESS") {
      throw new Error("Refresh token invalido para comercio");
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_get_session(?, ?, ?)",
      [payload.idLogin, payload.idUser, payload.idBusiness ?? null],
    );

    const result = rows as unknown as SessionDbRow[][];
    const session = result[0]?.[0];

    if (!session) {
      throw new Error("Sesión inválida o expirada");
    }

    const tokenMatch = await bcrypt.compare(
      refreshToken,
      session.refresh_token_hash,
    );

    if (!tokenMatch) {
      await pool.query("CALL sp_revoke_session(?)", [payload.idLogin]);
      throw new Error("Refresh token inválido");
    }

    await pool.query("CALL sp_revoke_session(?)", [payload.idLogin]);

    const accessToken = signAccessToken({
      context: "BUSINESS",
      idUser: session.idUser,
      idBusiness: session.idBusiness,
      businessRole: session.role,
    });

    const tempRefreshToken = signRefreshToken({
      context: "BUSINESS",
      idUser: session.idUser,
      idBusiness: session.idBusiness,
      idLogin: 0,
    });

    const tempHash = await hashRefreshToken(tempRefreshToken);
    const expiresAt = getRefreshExpirationDate();

    const [sessionRows] = await pool.query<RowDataPacket[]>(
      "CALL sp_create_session(?, ?, ?, ?, ?, ?)",
      [tempHash, expiresAt, null, null, session.idUser, session.idBusiness],
    );

    const sessionResult = sessionRows as unknown as { idLogin: number }[][];
    const newIdLogin = sessionResult[0][0].idLogin;

    const newRefreshToken = signRefreshToken({
      context: "BUSINESS",
      idUser: session.idUser,
      idBusiness: session.idBusiness,
      idLogin: newIdLogin,
    });

    const newRefreshHash = await hashRefreshToken(newRefreshToken);

    await pool.query(
      "UPDATE user_sessions SET refresh_token_hash = ? WHERE idLogin = ?",
      [newRefreshHash, newIdLogin],
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw error;
  }
}

export async function logoutService(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);

    if (payload.context !== "BUSINESS") {
      return;
    }

    await pool.query("CALL sp_revoke_session(?)", [payload.idLogin]);
  } catch {
    return;
  }
}

export async function getUserInfoByIdService(
  idUser: number,
  idBusiness: number,
): Promise<UserInfoResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_user_info_by_id(?, ?)",
    [idUser, idBusiness],
  );

  const result = rows as unknown as UserInfoDbRow[][];
  const user = result[0]?.[0];

  if (!user) {
    throw new Error("Usuario no encontrado o no pertenece al negocio");
  }

  return mapUserInfo(user);
}

export async function getAuthenticatedUserContextService(
  authUser: AuthUser,
): Promise<AuthenticatedUserContext> {
  const user = await getAuthenticatedUserContextRow(
    authUser.idUser,
    authUser.idBusiness,
  );

  if (!user) {
    throw new Error("Usuario autenticado no encontrado o inactivo");
  }

  const permissions = await getPermissionsForUser(
    authUser.idBusiness,
    authUser.idUser,
  );

  return mapAuthenticatedSessionUser(user, permissions);
}

export async function updatePasswordService(
  idUser: number,
  idBusiness: number,
  currentPassword: string,
  password: string,
  currentLoginId?: number,
): Promise<{ idUser: number; updated: boolean }> {
  const [currentRows] = await pool.query<RowDataPacket[]>(
    `SELECT u.idUser, u.password_hash
     FROM users u
     INNER JOIN business_users bu
       ON bu.idUser = u.idUser
       AND bu.idBusiness = ?
       AND bu.is_active = 1
     WHERE u.idUser = ?
       AND u.is_active = 1
     LIMIT 1`,
    [idBusiness, idUser],
  );
  const currentUser = (currentRows as UserPasswordHashRow[])[0];

  if (!currentUser) {
    throw new Error("Usuario no encontrado o inactivo");
  }

  const currentPasswordMatch = await bcrypt.compare(
    currentPassword,
    currentUser.password_hash,
  );

  if (!currentPasswordMatch) {
    throw new Error("La contrasena actual no es correcta");
  }

  const samePassword = await bcrypt.compare(password, currentUser.password_hash);

  if (samePassword) {
    throw new Error("La nueva contrasena debe ser diferente a la actual");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_user_password(?, ?, ?)",
    [idUser, idBusiness, passwordHash],
  );

  const result = rows as unknown as { idUser: number; updated: number }[][];
  const updatedUser = result[0]?.[0];

  if (!updatedUser?.updated) {
    throw new Error("No se pudo actualizar la contrasena del usuario");
  }

  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE idUser = ?
       AND idBusiness = ?
       AND auth_context = 'BUSINESS'
       AND revoked_at IS NULL
       AND (? IS NULL OR idLogin <> ?)`,
    [idUser, idBusiness, currentLoginId ?? null, currentLoginId ?? null],
  );

  return {
    idUser: updatedUser.idUser,
    updated: Boolean(updatedUser.updated),
  };
}
