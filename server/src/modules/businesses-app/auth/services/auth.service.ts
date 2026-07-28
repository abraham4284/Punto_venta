import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/libs/tokens.js";
import { getEffectivePermissionsService } from "../../permissions/services/permissions.service.js";
import type {
  AuthUser,
  AuthenticatedUserContext,
  LoginBody,
  RegisterBody,
  RegisterDbRow,
  LoginDbRow,
  SessionDbRow,
  UserInfoDbRow,
  UserInfoResponse,
} from "../types/auth.types.js";

const REFRESH_DAYS = 7;

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
    throw new Error("Credenciales inválidas");
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password_hash);

  if (!passwordMatch) {
    throw new Error("Credenciales inválidas");
  }

  const accessToken = signAccessToken({
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    role: user.role,
  });

  const tempRefreshToken = signRefreshToken({
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

  return {
    accessToken,
    refreshToken,
    user: {
      idUser: user.idUser,
      name: user.name,
      username: user.username,
      email: user.email,
      idBusiness: user.idBusiness,
      businessName: user.business_name,
      businessSlug: user.business_slug,
      businessStatus: user.business_status,
      role: user.role,
      mustChangePassword: Boolean(user.mustChangePassword),
      permissions,
    },
  };
}

export async function registerService(
  data: RegisterBody,
  userAgent?: string,
  ip?: string,
) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_user_register_with_business(?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    ],
  );

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
    user: {
      idUser: user.idUser,
      name: user.name,
      username: user.username,
      email: user.email,
      idBusiness: user.idBusiness,
      businessName: user.businessName,
      businessSlug: user.businessSlug,
      businessType: user.businessType,
      logoUrl: user.logoUrl,
      businessStatus: user.businessStatus,
      role: user.role,
      mustChangePassword: Boolean(user.mustChangePassword),
      permissions,
    },
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
    console.error("Error en refreshTokenService:", error);
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
  const profile = await getUserInfoByIdService(
    authUser.idUser,
    authUser.idBusiness,
  );
  const permissions = await getPermissionsForUser(
    authUser.idBusiness,
    authUser.idUser,
  );

  return {
    idUser: authUser.idUser,
    idBusiness: authUser.idBusiness,
    role: authUser.role,
    name: profile.name,
    username: profile.username,
    email: profile.email,
    mustChangePassword: profile.mustChangePassword,
    permissions,
    user: {
      idUser: authUser.idUser,
      idBusiness: authUser.idBusiness,
      role: authUser.role,
      mustChangePassword: profile.mustChangePassword,
      permissions,
    },
  };
}

export async function updatePasswordService(
  idUser: number,
  idBusiness: number,
  password: string,
): Promise<{ idUser: number; updated: boolean }> {
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

  return {
    idUser: updatedUser.idUser,
    updated: Boolean(updatedUser.updated),
  };
}
