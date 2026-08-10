import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import {
  changeBusinessUserRole,
  changeBusinessUserStatus,
  createBusinessUser,
  getBusinessUserPermissions,
  getBusinessUsers,
  getPermissionGroups,
  resetBusinessUserPermissions,
  updateBusinessUser,
  updateBusinessUserPermissions,
} from "../api/business-users.api";
import type {
  BusinessUser,
  BusinessUserFieldError,
  BusinessUserPermissionPayload,
  BusinessUserRole,
  BusinessUsersFilters,
  BusinessUsersPagination,
  CreateBusinessUserBody,
  PermissionGroup,
  UpdateBusinessUserBody,
} from "../types";

type ApiValidationError = {
  message?: string;
  errors?: BusinessUserFieldError[];
};

const defaultFilters: BusinessUsersFilters = {
  search: "",
  role: "ALL",
  status: "ALL",
  page: 1,
  limit: 15,
};

const defaultPagination: BusinessUsersPagination = {
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 15,
};

const normalizeUsers = (value: unknown): BusinessUser[] => {
  return Array.isArray(value) ? (value as BusinessUser[]) : [];
};

const normalizePagination = (
  value: Partial<BusinessUsersPagination> | null | undefined,
): BusinessUsersPagination => {
  return {
    totalRecords: Number(value?.totalRecords ?? 0),
    currentPage: Number(value?.currentPage ?? 1),
    totalPages: Math.max(Number(value?.totalPages ?? 1), 1),
    limit: Number(value?.limit ?? 15),
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiValidationError>;
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

const getFieldErrors = (error: unknown): BusinessUserFieldError[] => {
  const axiosError = error as AxiosError<ApiValidationError>;
  return axiosError.response?.data?.errors ?? [];
};

export const useBusinessUsers = () => {
  const [users, setUsers] = useState<BusinessUser[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [filters, setFilters] = useState<BusinessUsersFilters>(defaultFilters);
  const [pagination, setPagination] =
    useState<BusinessUsersPagination>(defaultPagination);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BusinessUserFieldError[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getBusinessUsers(filters);
      console.log(data,'data')
      const responseData = data.data as typeof data.data & {
        records?: BusinessUser[];
      };
      setUsers(normalizeUsers(responseData?.users ?? responseData?.records));
      setPagination(normalizePagination(data.data?.pagination));
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError, "No se pudieron cargar los usuarios");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchPermissionGroups = useCallback(async () => {
    try {
      const { data } = await getPermissionGroups();
      setPermissionGroups(data.data);
    } catch (requestError: unknown) {
      toast.error(getErrorMessage(requestError, "No se pudieron cargar los permisos"));
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    void fetchPermissionGroups();
  }, [fetchPermissionGroups]);

  const applyFilters = (nextFilters: Partial<BusinessUsersFilters>) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
      page: 1,
    }));
  };

  const changePage = (page: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page,
    }));
  };

  const createUserAction = async (
    body: CreateBusinessUserBody,
  ): Promise<boolean> => {
    setSaving(true);
    setFieldErrors([]);
    try {
      await createBusinessUser(body);
      toast.success("Usuario creado correctamente");
      await fetchUsers();
      return true;
    } catch (requestError: unknown) {
      setFieldErrors(getFieldErrors(requestError));
      toast.error(getErrorMessage(requestError, "No se pudo crear el usuario"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateUserAction = async (
    idUser: number,
    body: UpdateBusinessUserBody,
  ): Promise<boolean> => {
    setSaving(true);
    setFieldErrors([]);

    try {
      await updateBusinessUser(idUser, body);
      toast.success("Usuario actualizado correctamente");
      await fetchUsers();
      return true;
    } catch (requestError: unknown) {
      setFieldErrors(getFieldErrors(requestError));
      toast.error(getErrorMessage(requestError, "No se pudo actualizar el usuario"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeRoleAction = async (
    idUser: number,
    role: "ADMIN" | "SELLER",
  ): Promise<void> => {
    try {
      const { data } = await changeBusinessUserRole(idUser, role);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.idUser === idUser ? data.data : user,
        ),
      );
      toast.success("Rol actualizado correctamente");
    } catch (requestError: unknown) {
      toast.error(getErrorMessage(requestError, "No se pudo actualizar el rol"));
    }
  };

  const changeStatusAction = async (
    idUser: number,
    isActive: boolean,
  ): Promise<void> => {
    setStatusLoadingId(idUser);

    try {
      const { data } = await changeBusinessUserStatus(idUser, isActive);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.idUser === idUser ? data.data : user,
        ),
      );
      toast.success("Estado actualizado correctamente");
    } catch (requestError: unknown) {
      toast.error(getErrorMessage(requestError, "No se pudo actualizar el estado"));
    } finally {
      setStatusLoadingId(null);
    }
  };

  const getUserPermissionsAction = async (idUser: number) => {
    const { data } = await getBusinessUserPermissions(idUser);
    return data.data;
  };

  const updateUserPermissionsAction = async (
    idUser: number,
    permissions: BusinessUserPermissionPayload[],
  ): Promise<boolean> => {
    setSaving(true);

    try {
      await updateBusinessUserPermissions(idUser, permissions);
      toast.success("Permisos actualizados correctamente");
      return true;
    } catch (requestError: unknown) {
      toast.error(getErrorMessage(requestError, "No se pudieron actualizar los permisos"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetUserPermissionsAction = async (idUser: number): Promise<boolean> => {
    setSaving(true);

    try {
      await resetBusinessUserPermissions(idUser);
      toast.success("Permisos restablecidos correctamente");
      return true;
    } catch (requestError: unknown) {
      toast.error(getErrorMessage(requestError, "No se pudieron restablecer los permisos"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = useMemo(
    () =>
      [
        { label: "Administrador", value: "ADMIN" },
        { label: "Vendedor", value: "SELLER" },
      ] satisfies { label: string; value: Exclude<BusinessUserRole, "OWNER"> }[],
    [],
  );

  return {
    users,
    filters,
    pagination,
    loading,
    saving,
    statusLoadingId,
    fieldErrors,
    error,
    permissionGroups,
    roleOptions,
    applyFilters,
    changePage,
    createUserAction,
    updateUserAction,
    changeRoleAction,
    changeStatusAction,
    getUserPermissionsAction,
    updateUserPermissionsAction,
    resetUserPermissionsAction,
    setFieldErrors,
  };
};
