import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { getCashSettlementByIdRequest } from "../api/cash-settlements.api";
import { getCashSettlementErrorMessage } from "../helpers/cash-settlement.helpers";
import type { CashSettlementWithPaymentsResponse } from "../types";

type ApiError = {
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message ?? axiosError.message;

  return getCashSettlementErrorMessage(message, fallback);
};

export const useCashSettlementDetail = () => {
  const [settlement, setSettlement] =
    useState<CashSettlementWithPaymentsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettlement = useCallback(async (idCashSettlement: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getCashSettlementByIdRequest(idCashSettlement);
      setSettlement(data.data);
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "No se pudo cargar el detalle de la rendición",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSettlement(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    settlement,
    loading,
    error,
    loadSettlement,
    reset,
  };
};
