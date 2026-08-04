import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import {
  changeCashRegisterStatusRequest,
  closeCashSessionRequest,
  createCashMovementRequest,
  createCashRegisterRequest,
  getCashMovementsRequest,
  getCashRegistersRequest,
  getCashSessionSummaryRequest,
  getCashSessionsRequest,
  getCurrentCashSessionRequest,
  openCashSessionRequest,
  setDefaultCashRegisterRequest,
  updateCashRegisterRequest,
} from "../api/cash.api";
import type {
  ApiErrorResponse,
  CashLiveSummaryResponse,
  CashMovementResponse,
  CashRegisterResponse,
  CashSessionFilters,
  CashSessionResponse,
  CloseCashSessionBody,
  CreateCashMovementBody,
  CreateCashRegisterBody,
  OpenCashSessionBody,
  PaginatedCashSessionsResponse,
  UpdateCashRegisterBody,
} from "../types";

export const emptyCashSessionFilters: CashSessionFilters = {
  idCashRegister: null,
  idUser: null,
  status: null,
  startDate: "",
  endDate: "",
};

const getAxiosMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

export const useCash = () => {
  const [registers, setRegisters] = useState<CashRegisterResponse[]>([]);
  const [currentSession, setCurrentSession] = useState<CashSessionResponse | null>(null);
  const [summary, setSummary] = useState<CashLiveSummaryResponse | null>(null);
  const [movements, setMovements] = useState<CashMovementResponse[]>([]);
  const [sessionDetailSummary, setSessionDetailSummary] =
    useState<CashLiveSummaryResponse | null>(null);
  const [sessionDetailMovements, setSessionDetailMovements] = useState<
    CashMovementResponse[]
  >([]);
  const [history, setHistory] = useState<PaginatedCashSessionsResponse>({
    sessions: [],
    pagination: { totalRecords: 0, currentPage: 1, totalPages: 1, limit: 15 },
  });
  const [filters, setFilters] = useState<CashSessionFilters>(emptyCashSessionFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRegisters = useCallback(async () => {
    const { data } = await getCashRegistersRequest();
    setRegisters(data.data ?? []);
  }, []);

  const refreshCurrentSession = useCallback(async () => {
    const { data } = await getCurrentCashSessionRequest();
    setCurrentSession(data.data);
    return data.data;
  }, []);

  const refreshSummary = useCallback(async (idCashSession: number) => {
    const { data } = await getCashSessionSummaryRequest(idCashSession);
    setSummary(data.data);
    return data.data;
  }, []);

  const refreshMovements = useCallback(async (idCashSession: number) => {
    const { data } = await getCashMovementsRequest(idCashSession);
    setMovements(data.data ?? []);
  }, []);

  const loadSessionDetail = useCallback(
    async (idCashSession: number): Promise<boolean> => {
      setDetailLoading(true);
      setError(null);

      try {
        const [summaryResponse, movementsResponse] = await Promise.all([
          getCashSessionSummaryRequest(idCashSession),
          getCashMovementsRequest(idCashSession),
        ]);

        setSessionDetailSummary(summaryResponse.data.data);
        setSessionDetailMovements(movementsResponse.data.data ?? []);
        return true;
      } catch (requestError) {
        toast.error(
          getAxiosMessage(requestError, "No se pudo cargar el detalle de caja"),
        );
        return false;
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  const clearSessionDetail = useCallback(() => {
    setSessionDetailSummary(null);
    setSessionDetailMovements([]);
  }, []);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await refreshRegisters();
      const session = await refreshCurrentSession();

      if (session) {
        await refreshSummary(session.idCashSession);
        await refreshMovements(session.idCashSession);
      } else {
        setSummary(null);
        setMovements([]);
      }
    } catch (requestError) {
      setError(getAxiosMessage(requestError, "No se pudo cargar caja"));
    } finally {
      setLoading(false);
    }
  }, [refreshCurrentSession, refreshMovements, refreshRegisters, refreshSummary]);

  const refreshHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getCashSessionsRequest(page, 15, filters);
      setHistory(data.data);
    } catch (requestError) {
      setError(getAxiosMessage(requestError, "No se pudo cargar el historial"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshDashboard]);

  const openSession = async (body: OpenCashSessionBody): Promise<boolean> => {
    setSaving(true);
    try {
      const { data } = await openCashSessionRequest(body);
      setCurrentSession(data.data);
      await refreshDashboard();
      toast.success(data.message || "Caja abierta correctamente");
      return true;
    } catch (requestError) {
      toast.error(getAxiosMessage(requestError, "No se pudo abrir caja"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const closeSession = async (
    idCashSession: number,
    body: CloseCashSessionBody,
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const { data } = await closeCashSessionRequest(idCashSession, body);
      setCurrentSession(data.data.session);
      await refreshDashboard();
      toast.success(data.message || "Caja cerrada correctamente");
      return true;
    } catch (requestError) {
      toast.error(getAxiosMessage(requestError, "No se pudo cerrar caja"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createMovement = async (
    idCashSession: number,
    body: CreateCashMovementBody,
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const { data } = await createCashMovementRequest(idCashSession, body);
      toast.success(data.message || "Movimiento registrado");
      await refreshDashboard();
      return true;
    } catch (requestError) {
      toast.error(getAxiosMessage(requestError, "No se pudo registrar movimiento"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createRegister = async (body: CreateCashRegisterBody): Promise<boolean> => {
    setSaving(true);
    try {
      const { data } = await createCashRegisterRequest(body);
      toast.success(data.message || "Caja creada correctamente");
      await refreshRegisters();
      return true;
    } catch (requestError) {
      toast.error(getAxiosMessage(requestError, "No se pudo crear la caja"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateRegister = async (
    idCashRegister: number,
    body: UpdateCashRegisterBody,
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const { data } = await updateCashRegisterRequest(idCashRegister, body);
      toast.success(data.message || "Caja actualizada correctamente");
      await refreshRegisters();
      return true;
    } catch (requestError) {
      toast.error(getAxiosMessage(requestError, "No se pudo actualizar la caja"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeRegisterStatus = async (
    idCashRegister: number,
    isActive: boolean,
  ): Promise<void> => {
    setSaving(true);
    try {
      const { data } = await changeCashRegisterStatusRequest(
        idCashRegister,
        isActive,
      );
      toast.success(data.message || "Estado actualizado");
      await refreshRegisters();
    } catch (requestError) {
      toast.error(getAxiosMessage(requestError, "No se pudo actualizar el estado"));
    } finally {
      setSaving(false);
    }
  };

  const setDefaultRegister = async (idCashRegister: number): Promise<void> => {
    setSaving(true);
    try {
      const { data } = await setDefaultCashRegisterRequest(idCashRegister);
      toast.success(data.message || "Caja predeterminada actualizada");
      await refreshRegisters();
    } catch (requestError) {
      toast.error(getAxiosMessage(requestError, "No se pudo marcar predeterminada"));
    } finally {
      setSaving(false);
    }
  };

  const applyHistoryFilters = (nextFilters: CashSessionFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  const clearHistoryFilters = () => {
    setPage(1);
    setFilters(emptyCashSessionFilters);
  };

  return {
    registers,
    currentSession,
    summary,
    movements,
    sessionDetailSummary,
    sessionDetailMovements,
    history,
    filters,
    page,
    loading,
    detailLoading,
    saving,
    error,
    setPage,
    refreshDashboard,
    refreshHistory,
    loadSessionDetail,
    clearSessionDetail,
    openSession,
    closeSession,
    createMovement,
    createRegister,
    updateRegister,
    changeRegisterStatus,
    setDefaultRegister,
    applyHistoryFilters,
    clearHistoryFilters,
  };
};
