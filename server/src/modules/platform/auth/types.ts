import type { RowDataPacket } from "mysql2";
import type { PlatformRole } from "@/types/auth.types.js";

export interface PlatformLoginBody {
  username: string;
  password: string;
}

export interface PlatformBootstrapBody {
  idUser: number;
  role: PlatformRole;
}

export interface PlatformUserResponse {
  idPlatformUser: number;
  idUser: number;
  name?: string;
  username?: string;
  email?: string | null;
  role: PlatformRole;
  isActive: boolean;
  createdAt: Date;
}

export interface PlatformUserBootstrapRow extends RowDataPacket {
  idPlatformUser: number;
  idUser: number;
  role: PlatformRole;
  isActive: number;
  createdAt: Date;
}

export interface PlatformLoginUserRow extends RowDataPacket {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  password_hash: string;
  userActive: number;
  idPlatformUser: number;
  role: PlatformRole;
  platformUserActive: number;
}

export interface PlatformSessionRow extends RowDataPacket {
  idLogin: number;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  idPlatformUser: number;
  role: PlatformRole;
}

export interface PlatformSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    idUser: number;
    idPlatformUser: number;
    name: string;
    username: string;
    email: string | null;
    platformRole: PlatformRole;
  };
}

export interface PlatformServiceError extends Error {
  statusCode: number;
}
