import bcrypt from "bcrypt";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/libs/tokens.js";
import type {
  LoginBody,
  RegisterBody,
  LoginDbRow,
  SessionDbRow,
} from "../types/auth.types.js";

const REFRESH_DAYS = 7;

const getRefreshExpirationDate = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
  return expiresAt;
};

const hashRefreshToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};

export const loginService = async (
  data: LoginBody,
  userAgent?: string,
  ip?: string,
) => {
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
    idUser: user.idUser,
    idBusiness: user.idBusiness,
    idLogin,
  });

  const refreshTokenHash = await hashRefreshToken(refreshToken);

  await pool.query(
    "UPDATE user_sessions SET refresh_token_hash = ? WHERE idLogin = ?",
    [refreshTokenHash, idLogin],
  );

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
      role: user.role,
    },
  };
};

export const registerService = async (data: RegisterBody) => {
  const passwordHash = await bcrypt.hash(data.password, 10);

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_user_register_with_business(?, ?, ?, ?, ?, ?, ?)",
    [
      data.name,
      data.username,
      data.email ?? null,
      passwordHash,
      data.businessName,
      data.businessSlug,
      data.businessType ?? "FINANCIERA",
    ],
  );

  const result = rows as unknown as {
    idUser: number;
    idBusiness: number;
    role: "OWNER";
  }[][];

  return result[0][0];
};

export const refreshTokenService = async (refreshToken: string) => {
  try {
    const payload = verifyRefreshToken(refreshToken);

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
      idUser: session.idUser,
      idBusiness: session.idBusiness,
      role: session.role,
    });

    const tempRefreshToken = signRefreshToken({
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
};

export const logoutService = async (refreshToken?: string): Promise<void> => {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);
    await pool.query("CALL sp_revoke_session(?)", [payload.idLogin]);
  } catch {
    return;
  }
};
