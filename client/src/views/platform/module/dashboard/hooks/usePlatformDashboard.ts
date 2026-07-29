import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { getPlatformDashboardRequest } from "../api/platform-dashboard.api";
import type { PlatformDashboardResponse } from "../types";

export const usePlatformDashboard = () => {
  const [dashboard, setDashboard] = useState<PlatformDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getPlatformDashboardRequest();
      setDashboard(data.data);
      setUpdatedAt(new Date());
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "No se pudo cargar el dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    updatedAt,
    refresh: fetchDashboard,
  };
};
