export type BusinessUserRole = "OWNER" | "ADMIN" | "SELLER";

export type PermissionEffect = "ALLOW" | "DENY";

export type BusinessUser = {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: BusinessUserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type BusinessUsersPagination = {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export type BusinessUsersResponse = {
  users: BusinessUser[];
  pagination: BusinessUsersPagination;
};

export type BusinessUsersFilters = {
  search: string;
  role: "ALL" | BusinessUserRole;
  status: "ALL" | "ACTIVE" | "INACTIVE";
  page: number;
  limit: number;
};

export type CreateBusinessUserBody = {
  name: string;
  username: string;
  email: string | null;
  password: string;
  role: "ADMIN" | "SELLER";
  permissions?: BusinessUserPermissionPayload[];
};

export type UpdateBusinessUserBody = {
  name: string;
  username: string;
  email: string | null;
};

export type BusinessUserPermissionPayload = {
  code: string;
  effect: PermissionEffect;
};

export type PermissionItem = {
  idPermission: number;
  code: string;
  module: string;
  action: string;
  description: string | null;
};

export type PermissionGroup = {
  module: string;
  permissions: PermissionItem[];
};

export type BusinessUserPermissionsResponse = {
  rolePermissions: string[];
  overrides: BusinessUserPermissionPayload[];
  effectivePermissions: string[];
};

export type BusinessUserFieldError = {
  field: string;
  message: string;
};
