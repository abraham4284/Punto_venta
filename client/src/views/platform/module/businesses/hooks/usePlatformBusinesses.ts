import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import {
  changePlatformBusinessStatusRequest,
  getPlatformBusinessesRequest,
} from "../api/platform-businesses.api";
import type {
  PlatformBusinessFilters,
  PlatformBusinessListItem,
} from "../types";

export const emptyBusinessFilters: PlatformBusinessFilters = {
  search: "",
  businessStatus: "ALL",
  subscriptionStatus: "ALL",
  planId: "",
  businessType: "",
  activityStatus: "ALL",
  createdFrom: "",
  createdTo: "",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

export const usePlatformBusinesses = () => {
  const [businesses, setBusinesses] = useState<PlatformBusinessListItem[]>([]);
  const [filters, setFilters] = useState<PlatformBusinessFilters>(emptyBusinessFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getPlatformBusinessesRequest(filters, page);
      setBusinesses(data.data.rows);
      setTotalPages(data.data.pagination.totalPages || 1);
      setTotalRecords(data.data.pagination.totalRecords);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar los negocios"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBusinesses();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBusinesses]);

  const applyFilters = (nextFilters: PlatformBusinessFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(emptyBusinessFilters);
  };

  const changeStatus = async (
    idBusiness: number,
    isActive: boolean,
    reason: string,
  ) => {
    setActionLoading(idBusiness);

    try {
      const { data } = await changePlatformBusinessStatusRequest(
        idBusiness,
        isActive,
        reason,
      );
      setBusinesses((current) =>
        current.map((business) =>
          business.idBusiness === idBusiness ? data.data : business,
        ),
      );
      toast.success(data.message || "Estado actualizado correctamente");
      return true;
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo actualizar el negocio"));
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  return {
    businesses,
    filters,
    page,
    totalPages,
    totalRecords,
    loading,
    actionLoading,
    error,
    setPage,
    applyFilters,
    clearFilters,
    refresh: fetchBusinesses,
    changeStatus,
  };
};
