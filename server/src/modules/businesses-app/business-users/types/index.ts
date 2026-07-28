import type { RowDataPacket } from "mysql2";
import type { BusinessRole } from "@/types/auth.types.js";
import type {
  PermissionEffect,
  PermissionSummary,
  UserPermissionOverride,
} from "@/modules/businesses-app/permissions/types/index.js";

export type ManageableBusinessRole = "ADMIN" | "SELLER";
export type BusinessUserStatusFilter = "ACTIVE" | "INACTIVE";

export interface BusinessUserListFilters {
  search?: string | null;
  role?: BusinessRole | null;
  status?: BusinessUserStatusFilter | null;
  page: number;
  limit: number;
  offset: number;
}

export interface BusinessUserRow extends RowDataPacket {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: BusinessRole;
  userIsActive: number;
  membershipIsActive: number;
  effectiveIsActive: number;
  mustChangePassword: number;
  createdAt: Date;
  updatedAt: Date | null;
  customizedPermissions: number;
}

export interface TotalRow extends RowDataPacket {
  totalRecords: number;
}

export interface BusinessUserListItem {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: BusinessRole;
  isActive: boolean;
  userIsActive: boolean;
  membershipIsActive: boolean;
  effectiveIsActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  customizedPermissions: boolean;
}

export interface PaginatedBusinessUsersResponse {
  users: BusinessUserListItem[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

export interface BusinessUserPermissionPayload {
  code: string;
  effect: PermissionEffect;
}

export interface CreateBusinessUserPayload {
  idBusiness: number;
  actorUserId: number;
  name: string;
  username: string;
  email?: string | null;
  password: string;
  role: ManageableBusinessRole;
  permissions?: BusinessUserPermissionPayload[];
}

export interface UpdateBusinessUserPayload {
  idBusiness: number;
  idUser: number;
  name: string;
  username: string;
  email?: string | null;
}

export interface ChangeBusinessUserRolePayload {
  idBusiness: number;
  idUser: number;
  role: ManageableBusinessRole;
}

export interface ChangeBusinessUserStatusPayload {
  idBusiness: number;
  actorUserId: number;
  idUser: number;
  isActive: boolean;
}

export interface UpdateBusinessUserPermissionsPayload {
  idBusiness: number;
  actorUserId: number;
  idUser: number;
  permissions: BusinessUserPermissionPayload[];
}

export interface BusinessUserPermissionsResponse extends PermissionSummary {
  overrides: UserPermissionOverride[];
}
