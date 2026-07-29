import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import type { PlatformRole } from "@/views/platform/module/auth/types";
import {
  changePlatformUserRoleRequest,
  changePlatformUserStatusRequest,
  createPlatformUserRequest,
  getPlatformUsersRequest,
  revokePlatformUserSessionsRequest,
} from "../api/platform-users.api";
import type {
  CreatePlatformUserBody,
  PlatformUserAdmin,
  PlatformUserFilters,
} from "../types";

export const emptyPlatformUserFilters: PlatformUserFilters = {
  search: "",
  role: "ALL",
  isActive: "ALL",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

export const usePlatformUsers = () => {
  const [users, setUsers] = useState<PlatformUserAdmin[]>([]);
  const [filters, setFilters] = useState(emptyPlatformUserFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getPlatformUsersRequest(filters, page);
      setUsers(data.data.rows);
      setTotalPages(data.data.pagination.totalPages || 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar los usuarios"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchUsers]);

  const createUser = async (body: CreatePlatformUserBody) => {
    setActionLoading("create");

    try {
      const { data } = await createPlatformUserRequest(body);
      toast.success(data.message || "Usuario creado correctamente");
      await fetchUsers();
      return true;
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo crear el usuario"));
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (idPlatformUser: number, platformRole: PlatformRole) => {
    setActionLoading(`role-${idPlatformUser}`);

    try {
      const { data } = await changePlatformUserRoleRequest(idPlatformUser, platformRole);
      setUsers((current) =>
        current.map((user) =>
          user.idPlatformUser === idPlatformUser ? data.data : user,
        ),
      );
      toast.success(data.message || "Rol actualizado correctamente");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo actualizar el rol"));
    } finally {
      setActionLoading(null);
    }
  };

  const changeStatus = async (
    idPlatformUser: number,
    isActive: boolean,
    reason: string,
  ) => {
    setActionLoading(`status-${idPlatformUser}`);

    try {
      const { data } = await changePlatformUserStatusRequest(
        idPlatformUser,
        isActive,
        reason,
      );
      setUsers((current) =>
        current.map((user) =>
          user.idPlatformUser === idPlatformUser ? data.data : user,
        ),
      );
      toast.success(data.message || "Estado actualizado correctamente");
      return true;
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo actualizar el estado"));
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const revokeSessions = async (idPlatformUser: number, reason: string) => {
    setActionLoading(`sessions-${idPlatformUser}`);

    try {
      const { data } = await revokePlatformUserSessionsRequest(idPlatformUser, reason);
      toast.success(data.message || "Sesiones revocadas correctamente");
      await fetchUsers();
      return true;
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudieron revocar sesiones"));
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const applyFilters = (nextFilters: PlatformUserFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  return {
    users,
    filters,
    page,
    totalPages,
    loading,
    actionLoading,
    error,
    setPage,
    applyFilters,
    createUser,
    changeRole,
    changeStatus,
    revokeSessions,
  };
};
