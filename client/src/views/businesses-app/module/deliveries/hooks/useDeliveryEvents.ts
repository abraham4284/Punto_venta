import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { getDeliveryEventsRequest } from "../api/deliveries.api";
import type { DeliveryEventResponse } from "../types";

type ApiError = {
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

export const useDeliveryEvents = () => {
  const [events, setEvents] = useState<DeliveryEventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async (idSaleDelivery: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getDeliveryEventsRequest(idSaleDelivery);
      setEvents(data.data ?? []);
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "No se pudo cargar el historial de la entrega",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEvents = useCallback(
    async (idSaleDelivery: number) => {
      await loadEvents(idSaleDelivery);
    },
    [loadEvents],
  );

  const reset = useCallback(() => {
    setEvents([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    events,
    loading,
    error,
    loadEvents,
    refreshEvents,
    reset,
  };
};
