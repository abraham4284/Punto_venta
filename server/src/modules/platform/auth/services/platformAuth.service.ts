import bcrypt from "bcrypt";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/libs/tokens.js";
import type { PlatformRole } from "@/types/auth.types.js";
import type {
  PlatformBaseUserBody,
  PlatformBaseUserResponse,
  PlatformBaseUserRow,
  PlatformBootstrapBody,
  PlatformLoginBody,
  PlatformLoginUserRow,
  PlatformServiceError,
  PlatformSessionResponse,
  PlatformSessionRow,
  PlatformUserBootstrapRow,
  PlatformUserResponse,
} from "../types.js";

const REFRESH_DAYS = 7;

function createPlatformServiceError(
  message: string,
  statusCode: number,
): PlatformServiceError {
  const error = new Error(message) as PlatformServiceError;
  error.statusCode = statusCode;
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

function mapPlatformUser(row: PlatformUserBootstrapRow): PlatformUserResponse {
  return {
    idPlatformUser: row.idPlatformUser,
    idUser: row.idUser,
    role: row.role,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
  };
}

function mapPlatformBaseUser(row: PlatformBaseUserRow): PlatformBaseUserResponse {
  return {
    idUser: row.idUser,
    name: row.name,
    username: row.username,
    email: row.email,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
  };
}

function mapSqlBootstrapError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "No se pudo crear usuario platform";

  if (message.includes("USER_NOT_FOUND_OR_INACTIVE")) {
    throw createPlatformServiceError("Usuario no encontrado o inactivo", 404);
  }

  if (message.includes("PLATFORM_USER_ALREADY_EXISTS")) {
    throw createPlatformServiceError("El usuario ya pertenece a plataforma", 409);
  }

  if (message.includes("PLATFORM_ALREADY_BOOTSTRAPPED")) {
    throw createPlatformServiceError("La plataforma ya fue inicializada", 409);
  }

  if (message.includes("PLATFORM_BOOTSTRAP_LOCK_TIMEOUT")) {
    throw createPlatformServiceError(
      "No se pudo obtener el bloqueo de inicializacion",
      409,
    );
  }

  throw createPlatformServiceError(message, 400);
}

function mapSqlBaseUserError(error: unknown): never {
  const sqlError = error as { code?: string; sqlMessage?: string; message?: string };
  const message =
    sqlError.sqlMessage ||
    sqlError.message ||
    "No se pudo crear el usuario base de plataforma";

  if (sqlError.code === "ER_DUP_ENTRY" || message.includes("Duplicate entry")) {
    throw createPlatformServiceError(
      "El usuario o email ya se encuentra registrado",
      409,
    );
  }

  throw createPlatformServiceError(message, 400);
}

async function createPlatformSession(
  idUser: number,
  platformRole: PlatformRole,
  userAgent?: string,
  ip?: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken({
    context: "PLATFORM",
    idUser,
    platformRole,
  });

  const tempRefreshToken = signRefreshToken({
    context: "PLATFORM",
    idUser,
    idLogin: 0,
  });

  const tempRefreshHash = await hashRefreshToken(tempRefreshToken);
  const expiresAt = getRefreshExpirationDate();

  const [sessionResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO user_sessions (
      refresh_token_hash,
      created_at,
      expires_at,
      user_agent,
      ip,
      idUser,
      idBusiness,
      auth_context
    ) VALUES (?, NOW(), ?, ?, ?, ?, NULL, 'PLATFORM')`,
    [tempRefreshHash, expiresAt, userAgent ?? null, ip ?? null, idUser],
  );

  const refreshToken = signRefreshToken({
    context: "PLATFORM",
    idUser,
    idLogin: sessionResult.insertId,
  });
  const refreshTokenHash = await hashRefreshToken(refreshToken);

  await pool.query(
    "UPDATE user_sessions SET refresh_token_hash = ? WHERE idLogin = ?",
    [refreshTokenHash, sessionResult.insertId],
  );

  return {
    accessToken,
    refreshToken,
  };
}

export async function bootstrapPlatformAdminService(
  data: PlatformBootstrapBody,
): Promise<PlatformUserResponse> {
  if (process.env.PLATFORM_BOOTSTRAP_ENABLED !== "true") {
    throw createPlatformServiceError("Recurso no encontrado", 404);
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_user_bootstrap(?, ?)",
      [data.idUser, data.role],
    );
    const result = rows as unknown as PlatformUserBootstrapRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw createPlatformServiceError("No se pudo crear usuario platform", 400);
    }

    return mapPlatformUser(user);
  } catch (error) {
    mapSqlBootstrapError(error);
  }
}

export async function createPlatformBaseUserService(
  data: PlatformBaseUserBody,
): Promise<PlatformBaseUserResponse> {
  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_create_base_user(?, ?, ?, ?)",
      [data.name, data.username, data.email ?? null, passwordHash],
    );
    const result = rows as unknown as PlatformBaseUserRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw createPlatformServiceError(
        "No se pudo crear el usuario base de plataforma",
        400,
      );
    }

    return mapPlatformBaseUser(user);
  } catch (error) {
    mapSqlBaseUserError(error);
  }
}

export async function createPlatformUserService(
  data: PlatformBootstrapBody,
): Promise<PlatformUserResponse> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "CALL sp_platform_user_bootstrap(?, ?)",
      [data.idUser, data.role],
    );
    const result = rows as unknown as PlatformUserBootstrapRow[][];
    const user = result[0]?.[0];

    if (!user) {
      throw createPlatformServiceError("No se pudo crear usuario platform", 400);
    }

    return mapPlatformUser(user);
  } catch (error) {
    mapSqlBootstrapError(error);
  }
}

export async function loginPlatformService(
  data: PlatformLoginBody,
  userAgent?: string,
  ip?: string,
): Promise<PlatformSessionResponse> {
  const [rows] = await pool.query<PlatformLoginUserRow[]>(
    `SELECT
      u.idUser,
      u.name,
      u.username,
      u.email,
      u.password_hash,
      u.is_active AS userActive,
      pu.idPlatformUser,
      pu.role,
      pu.is_active AS platformUserActive
    FROM users u
    INNER JOIN platform_users pu ON pu.idUser = u.idUser
    WHERE u.username = ?
      AND u.is_active = 1
      AND pu.is_active = 1
    LIMIT 1`,
    [data.username],
  );

  const user = rows[0];

  if (!user) {
    throw createPlatformServiceError("Credenciales invalidas", 401);
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password_hash);

  if (!passwordMatch) {
    throw createPlatformServiceError("Credenciales invalidas", 401);
  }

  const tokens = await createPlatformSession(
    user.idUser,
    user.role,
    userAgent,
    ip,
  );

  return {
    ...tokens,
    user: {
      idUser: user.idUser,
      idPlatformUser: user.idPlatformUser,
      name: user.name,
      username: user.username,
      email: user.email,
      platformRole: user.role,
    },
  };
}

export async function refreshPlatformTokenService(
  refreshToken: string,
): Promise<PlatformSessionResponse> {
  const payload = verifyRefreshToken(refreshToken);

  if (payload.context !== "PLATFORM") {
    throw createPlatformServiceError("Refresh token invalido", 401);
  }

  const [rows] = await pool.query<PlatformSessionRow[]>(
    `SELECT
      us.idLogin,
      us.refresh_token_hash,
      us.expires_at,
      us.revoked_at,
      us.idUser,
      u.name,
      u.username,
      u.email,
      pu.idPlatformUser,
      pu.role
    FROM user_sessions us
    INNER JOIN users u ON u.idUser = us.idUser
    INNER JOIN platform_users pu ON pu.idUser = u.idUser
    WHERE us.idLogin = ?
      AND us.idUser = ?
      AND us.auth_context = 'PLATFORM'
      AND us.idBusiness IS NULL
      AND us.revoked_at IS NULL
      AND us.expires_at > NOW()
      AND u.is_active = 1
      AND pu.is_active = 1
    LIMIT 1`,
    [payload.idLogin, payload.idUser],
  );
  const session = rows[0];

  if (!session) {
    throw createPlatformServiceError("Sesion invalida o expirada", 401);
  }

  const tokenMatch = await bcrypt.compare(
    refreshToken,
    session.refresh_token_hash,
  );

  if (!tokenMatch) {
    await pool.query("CALL sp_revoke_session(?)", [payload.idLogin]);
    throw createPlatformServiceError("Refresh token invalido", 401);
  }

  await pool.query("CALL sp_revoke_session(?)", [payload.idLogin]);

  const tokens = await createPlatformSession(session.idUser, session.role);

  return {
    ...tokens,
    user: {
      idUser: session.idUser,
      idPlatformUser: session.idPlatformUser,
      name: session.name,
      username: session.username,
      email: session.email,
      platformRole: session.role,
    },
  };
}

export async function logoutPlatformService(
  refreshToken?: string,
): Promise<void> {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);

    if (payload.context !== "PLATFORM") {
      return;
    }

    await pool.query("CALL sp_revoke_session(?)", [payload.idLogin]);
  } catch {
    return;
  }
}

export async function getPlatformMeService(
  idUser: number,
): Promise<PlatformSessionResponse["user"]> {
  const [rows] = await pool.query<PlatformLoginUserRow[]>(
    `SELECT
      u.idUser,
      u.name,
      u.username,
      u.email,
      u.password_hash,
      u.is_active AS userActive,
      pu.idPlatformUser,
      pu.role,
      pu.is_active AS platformUserActive
    FROM users u
    INNER JOIN platform_users pu ON pu.idUser = u.idUser
    WHERE u.idUser = ?
      AND u.is_active = 1
      AND pu.is_active = 1
    LIMIT 1`,
    [idUser],
  );
  const user = rows[0];

  if (!user) {
    throw createPlatformServiceError("Usuario de plataforma no encontrado", 404);
  }

  return {
    idUser: user.idUser,
    idPlatformUser: user.idPlatformUser,
    name: user.name,
    username: user.username,
    email: user.email,
    platformRole: user.role,
  };
}
