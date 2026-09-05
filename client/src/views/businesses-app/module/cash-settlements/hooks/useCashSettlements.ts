import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import {
  createCashSettlementRequest,
  getCashSettlementsRequest,
} from "../api/cash-settlements.api";
import type {
  CashSettlementFilters,
  CashSettlementPagination,
  CashSettlementResponse,
  CreateCashSettlementBody,
} from "../types";

type ApiError = {
  message?: string;
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
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

export const useCashSettlements = () => {
  const [settlements, setSettlements] = useState<CashSettlementResponse[]>([]);
  const [filters, setFilters] = useState<CashSettlementFilters>(defaultFilters);
  const [pagination, setPagination] =
    useState<CashSettlementPagination>(defaultPagination);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getCashSettlementsRequest(
        pagination.currentPage,
        pagination.limit,
        filters,
      );
      setSettlements(data.data.settlements);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar las liquidaciones"));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  const createSettlement = async (body: CreateCashSettlementBody) => {
    setSaving(true);

    try {
      const { data } = await createCashSettlementRequest(body);
      toast.success(data.message);
      await fetchSettlements();
      return data.data;
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo registrar la liquidacion"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const applyFilters = (nextFilters: CashSettlementFilters) => {
    setFilters(nextFilters);
    setPagination((current) => ({ ...current, currentPage: 1 }));
  };

  const changePage = (page: number) => {
    setPagination((current) => ({
      ...current,
      currentPage: Math.min(Math.max(page, 1), current.totalPages),
    }));
  };

  useEffect(() => {
    void fetchSettlements();
  }, [fetchSettlements]);

  return {
    settlements,
    filters,
    pagination,
    loading,
    saving,
    createSettlement,
    applyFilters,
    changePage,
  };
};
