import type {
  BusinessUserListItem,
  BusinessUserRow,
} from "../types/index.js";

export function mapBusinessUser(row: BusinessUserRow): BusinessUserListItem {
  return {
    idUser: row.idUser,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    isActive: Boolean(row.effectiveIsActive),
    userIsActive: Boolean(row.userIsActive),
    membershipIsActive: Boolean(row.membershipIsActive),
    effectiveIsActive: Boolean(row.effectiveIsActive),
    mustChangePassword: Boolean(row.mustChangePassword),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customizedPermissions: Boolean(row.customizedPermissions),
  };
}
