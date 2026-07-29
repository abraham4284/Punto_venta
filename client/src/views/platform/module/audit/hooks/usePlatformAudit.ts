import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import {
  getPlatformAuditLogByIdRequest,
  getPlatformAuditLogsRequest,
} from "../api/platform-audit.api";
import type { PlatformAuditFilters, PlatformAuditLog } from "../types";

export const emptyAuditFilters: PlatformAuditFilters = {
  platformUserId: "",
  action: "",
  entityType: "",
  entityId: "",
  idBusiness: "",
  dateFrom: "",
  dateTo: "",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

export const usePlatformAudit = () => {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);
  const [filters, setFilters] = useState(emptyAuditFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getPlatformAuditLogsRequest(filters, page);
      setLogs(data.data.rows);
      setTotalPages(data.data.pagination.totalPages || 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar la auditoria"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLogs();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLogs]);

  const applyFilters = (nextFilters: PlatformAuditFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(emptyAuditFilters);
  };

  const openDetail = async (idPlatformAuditLog: number) => {
    setDetailLoading(true);

    try {
      const { data } = await getPlatformAuditLogByIdRequest(idPlatformAuditLog);
      setSelectedLog(data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo abrir la auditoria"));
    } finally {
      setDetailLoading(false);
    }
  };

  return {
    logs,
    selectedLog,
    filters,
    page,
    totalPages,
    loading,
    detailLoading,
    error,
    setPage,
    setSelectedLog,
    applyFilters,
    clearFilters,
    openDetail,
  };
};
