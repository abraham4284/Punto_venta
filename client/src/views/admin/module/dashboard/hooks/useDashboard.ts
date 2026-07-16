import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { getDashboardMetrics } from "../api/dashboard.api";
import type { DashboardData } from "../types";

type ApiErrorResponse = {
  status: boolean;
  message: string;
};

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async (year = selectedYear) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getDashboardMetrics(year);

      setDashboardData(response.data.data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message ||
          "No se pudieron obtener las metricas",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshDashboard(selectedYear);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshDashboard, selectedYear]);

  return {
    dashboardData,
    selectedYear,
    setSelectedYear,
    loading,
    error,
    refreshDashboard,
  };
};
