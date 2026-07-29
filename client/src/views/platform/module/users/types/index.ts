import type { PlatformRole } from "@/views/platform/module/auth/types";

export interface PlatformUserAdmin {
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

export interface PlatformUserFilters {
  search: string;
  role: "ALL" | PlatformRole;
  isActive: "ALL" | "ACTIVE" | "INACTIVE";
}

export interface CreatePlatformUserBody {
  name: string;
  username: string;
  email: string;
  password: string;
  platformRole: PlatformRole;
}

export interface PaginatedData<T> {
  rows: T[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}
