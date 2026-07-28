import type { RowDataPacket } from "mysql2";
import type { BusinessRole } from "@/types/auth.types.js";

export type PermissionEffect = "ALLOW" | "DENY";

export interface PermissionRow extends RowDataPacket {
  idPermission: number;
  code: string;
  module: string;
  action: string;
  name: string;
  description: string | null;
  isActive: number;
}

export interface PermissionResponse {
  idPermission: number;
  code: string;
  module: string;
  action: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface GroupedPermissionsResponse {
  module: string;
  permissions: PermissionResponse[];
}

export interface PermissionCodeRow extends RowDataPacket {
  code: string;
}

export interface PermissionOverrideRow extends RowDataPacket {
  code: string;
  module: string;
  action: string;
  name: string;
  effect: PermissionEffect;
}

export interface UserPermissionOverride {
  code: string;
  module: string;
  action: string;
  name: string;
  effect: PermissionEffect;
}

export interface PermissionSummary {
  role: BusinessRole;
  rolePermissions: string[];
  overrides: UserPermissionOverride[];
  effectivePermissions: string[];
}
