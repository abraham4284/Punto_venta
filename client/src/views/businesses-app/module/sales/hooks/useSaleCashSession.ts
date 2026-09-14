import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { getCurrentCashSessionRequest } from "../../cash/api/cash.api";
import type {
  ApiErrorResponse,
  CashSessionResponse,
} from "../../cash/types";

export const useSaleCashSession = () => {
  const [currentSession, setCurrentSession] =
    useState<CashSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCurrentSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCurrentCashSessionRequest();
      const session = response.data.data;

      setCurrentSession(session && session.status === "OPEN" ? session : null);

      return session && session.status === "OPEN" ? session : null;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message ||
          "No se pudo consultar la caja abierta",
      );
      setCurrentSession(null);

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshCurrentSession();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshCurrentSession]);

  return {
    currentSession,
    loading,
    error,
    refreshCurrentSession,
  };
};
