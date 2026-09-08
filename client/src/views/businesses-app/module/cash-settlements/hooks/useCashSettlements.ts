import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { getCurrentCashSessionRequest } from "../../cash/api/cash.api";
import type { CashSessionResponse } from "../../cash/types";
import {
  createCashSettlementRequest,
  getCashSettlementsRequest,
  getPendingCashSettlementsRequest,
} from "../api/cash-settlements.api";
import {
  getCashSettlementErrorMessage,
} from "../helpers/cash-settlement.helpers";
import type {
  CashSettlementFilters,
  CashSettlementPagination,
  CashSettlementResponse,
  CashSettlementWithPaymentsResponse,
  CreateCashSettlementBody,
  PendingCashSettlementCollectorResponse,
} from "../types";

type ApiError = {
  message?: string;
};

type UseCashSettlementsOptions = {
  canLoadCashSession?: boolean;
};

const defaultFilters: CashSettlementFilters = {
  collectorUserId: null,
  startDate: "",
  endDate: "",
};

const defaultPagination: CashSettlementPagination = {
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 15,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message ?? axiosError.message;

  return getCashSettlementErrorMessage(message, fallback);
};

export const useCashSettlements = ({
  canLoadCashSession = false,
}: UseCashSettlementsOptions = {}) => {
  const [settlements, setSettlements] = useState<CashSettlementResponse[]>([]);
  const [pendingCollectors, setPendingCollectors] = useState<
    PendingCashSettlementCollectorResponse[]
  >([]);
  const [filters, setFilters] = useState<CashSettlementFilters>(defaultFilters);
  const [pagination, setPagination] =
    useState<CashSettlementPagination>(defaultPagination);
  const [currentCashSession, setCurrentCashSession] =
    useState<CashSessionResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [cashSessionLoading, setCashSessionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [cashSessionError, setCashSessionError] = useState<string | null>(null);

  const fetchSettlements = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const { data } = await getCashSettlementsRequest(
        pagination.currentPage,
        pagination.limit,
        filters,
      );
      setSettlements(data.data.settlements);
      setPagination(data.data.pagination);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No se pudieron cargar las rendiciones",
      );
      setHistoryError(message);
      toast.error(message);
    } finally {
      setHistoryLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  const fetchPendingSettlements = useCallback(async (collectorUserId?: number | null) => {
    setPendingLoading(true);
    setPendingError(null);

    try {
      const { data } = await getPendingCashSettlementsRequest(collectorUserId);
      const collectors = data.data.collectors ?? [];
      setPendingCollectors(collectors);
      return collectors;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No se pudieron cargar los pagos pendientes de rendición",
      );
      setPendingError(message);
      toast.error(message);
      return [];
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const fetchCurrentCashSession = useCallback(async () => {
    if (!canLoadCashSession) {
      setCurrentCashSession(null);
      setCashSessionError(
        "No tenés permiso para consultar la caja abierta receptora.",
      );
      return null;
    }

    setCashSessionLoading(true);
    setCashSessionError(null);

    try {
      const { data } = await getCurrentCashSessionRequest();
      setCurrentCashSession(data.data);
      return data.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No se pudo consultar la caja abierta receptora",
      );
      setCashSessionError(message);
      return null;
    } finally {
      setCashSessionLoading(false);
    }
  }, [canLoadCashSession]);

  const createSettlement = async (
    body: CreateCashSettlementBody,
  ): Promise<CashSettlementWithPaymentsResponse | null> => {
    setSaving(true);

    try {
      const { data } = await createCashSettlementRequest(body);
      toast.success(data.message || "Rendición registrada correctamente");
      await Promise.all([fetchPendingSettlements(), fetchSettlements()]);
      return data.data;
    } catch (error) {
      const message = getErrorMessage(error, "No se pudo registrar la rendición");
      toast.error(message);
      await fetchPendingSettlements();

      if (
        message.includes("caja") ||
        message.includes("CASH_SESSION") ||
        message.includes("cerró")
      ) {
        await fetchCurrentCashSession();
      }

      return null;
    } finally {
      setSaving(false);
    }
  };

  const applyFilters = (nextFilters: CashSettlementFilters) => {
    if (
      nextFilters.startDate &&
      nextFilters.endDate &&
      nextFilters.startDate > nextFilters.endDate
    ) {
      toast.error("La fecha desde no puede ser posterior a la fecha hasta");
      return;
    }

    setFilters(nextFilters);
    setPagination((current) => ({ ...current, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPagination((current) => ({ ...current, currentPage: 1 }));
  };

  const changePage = (page: number) => {
    setPagination((current) => ({
      ...current,
      currentPage: Math.min(Math.max(page, 1), current.totalPages),
    }));
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSettlements();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSettlements]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPendingSettlements();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPendingSettlements]);

  useEffect(() => {
    if (!canLoadCashSession) return;

    const timeoutId = window.setTimeout(() => {
      void fetchCurrentCashSession();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canLoadCashSession, fetchCurrentCashSession]);

  return {
    settlements,
    pendingCollectors,
    filters,
    pagination,
    currentCashSession,
    historyLoading,
    pendingLoading,
    cashSessionLoading,
    saving,
    historyError,
    pendingError,
    cashSessionError,
    fetchSettlements,
    fetchPendingSettlements,
    fetchCurrentCashSession,
    createSettlement,
    applyFilters,
    clearFilters,
    changePage,
  };
};
