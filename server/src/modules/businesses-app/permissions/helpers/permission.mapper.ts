import type {
  PermissionOverrideRow,
  PermissionResponse,
  PermissionRow,
  UserPermissionOverride,
} from "../types/index.js";

export function mapPermission(row: PermissionRow): PermissionResponse {
  return {
    idPermission: row.idPermission,
    code: row.code,
    module: row.module,
    action: row.action,
    name: row.name,
    description: row.description,
    isActive: Boolean(row.isActive),
  };
}

export function mapPermissionOverride(
  row: PermissionOverrideRow,
): UserPermissionOverride {
  return {
    code: row.code,
    module: row.module,
    action: row.action,
    name: row.name,
    effect: row.effect,
  };
}
