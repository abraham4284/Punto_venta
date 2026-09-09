import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { getMyPendingCashSettlementRequest } from "../api/cash-settlements.api";
import { getCashSettlementErrorMessage } from "../helpers/cash-settlement.helpers";
import type { PendingCashSettlementCollectorResponse } from "../types";

type ApiError = {
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;
  return getCashSettlementErrorMessage(
    axiosError.response?.data?.message ?? axiosError.message,
    fallback,
  );
};

type UseMyPendingSettlementOptions = {
  enabled?: boolean;
};

export const useMyPendingSettlement = ({
  enabled = true,
}: UseMyPendingSettlementOptions = {}) => {
  const [collector, setCollector] =
    useState<PendingCashSettlementCollectorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPendingSettlement = useCallback(async () => {
    if (!enabled) {
      setCollector(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data } = await getMyPendingCashSettlementRequest();
      setCollector(data.data.collector ?? null);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No se pudo cargar tu rendición pendiente",
      );
      setError(message);
      setCollector(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchMyPendingSettlement();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchMyPendingSettlement]);

  return {
    collector,
    loading,
    error,
    fetchMyPendingSettlement,
  };
};
