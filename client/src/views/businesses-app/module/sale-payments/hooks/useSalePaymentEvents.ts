import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { getSalePaymentEventsRequest } from "../api/sale-payments.api";
import type { SalePaymentEventResponse } from "../types";

type ApiError = {
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

export const useSalePaymentEvents = () => {
  const [events, setEvents] = useState<SalePaymentEventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedPaymentId, setLoadedPaymentId] = useState<number | null>(null);

  const loadEvents = useCallback(async (idSalePayment: number) => {
    setLoading(true);
    setError(null);
    setLoadedPaymentId(idSalePayment);

    try {
      const { data } = await getSalePaymentEventsRequest(idSalePayment);
      setEvents(data.data ?? []);
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "No se pudo cargar el historial del pago",
      );
      setError(message);
      toast.error(message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setEvents([]);
    setError(null);
    setLoading(false);
    setLoadedPaymentId(null);
  }, []);

  return {
    events,
    loading,
    error,
    loadedPaymentId,
    loadEvents,
    reset,
  };
};
