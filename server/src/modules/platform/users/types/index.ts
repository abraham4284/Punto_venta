import type { RowDataPacket } from "mysql2";
import type { PlatformRole } from "@/types/auth.types.js";

export interface PlatformUserAdminRow extends RowDataPacket {
  idPlatformUser: number;
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: PlatformRole;
  isActive: number;
  createdAt: string;
  lastLoginAt: string | null;
  activeSessions: number | null;
}

export interface PlatformUserAdminResponse {
  idPlatformUser: number;
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: PlatformRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  activeSessions: number;
}

export interface PlatformUserListQuery {
  search?: string;
  role?: PlatformRole;
  isActive?: boolean;
  page: number;
  limit: number;
}

export interface CreatePlatformUserAdminBody {
  name: string;
  username: string;
  email?: string | null;
  password: string;
  platformRole: PlatformRole;
}

export interface ChangePlatformUserRoleBody {
  platformRole: PlatformRole;
}

export interface ChangePlatformUserStatusBody {
  isActive: boolean;
  reason: string;
}

export interface RevokePlatformUserSessionsBody {
  reason: string;
}

export interface TotalRow extends RowDataPacket {
  totalRecords: number;
}
