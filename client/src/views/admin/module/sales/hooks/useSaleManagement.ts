import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import { getSalesRequest } from "../api/sales.api";
import type {
  ApiErrorResponse,
  SaleFilters,
  SaleMetricsData,
  SaleResponse,
  SalesPagination,
} from "../types";

const initialFilters: SaleFilters = {
  saleNumber: "",
  idDeposit: null,
  status: null,
  startDate: "",
  endDate: "",
};

const initialPagination: SalesPagination = {
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 15,
};

const initialMetrics: SaleMetricsData = {
  total: 0,
  completed: 0,
  completedPercentage: 0,
  cancelled: 0,
  cancelledPercentage: 0,
  completedTotal: 0,
};

export const useSaleManagement = () => {
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [pagination, setPagination] =
    useState<SalesPagination>(initialPagination);
  const [metrics, setMetrics] = useState<SaleMetricsData>(initialMetrics);
  const [filters, setFilters] = useState<SaleFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSales = useCallback(
    async (nextPage = 1, nextFilters = initialFilters) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getSalesRequest(nextPage, limit, nextFilters);

        setSales(response.data.data.sales);
        setPagination(response.data.data.pagination);
        setMetrics(response.data.data.metrics);
        setPage(response.data.data.pagination.currentPage);
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        setError(
          axiosError.response?.data?.message ||
            "No se pudieron cargar las ventas",
        );
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  const updateFilters = (nextFilters: Partial<SaleFilters>) => {
    const mergedFilters = {
      ...filters,
      ...nextFilters,
    };

    setFilters(mergedFilters);
    setPage(1);
    void getSales(1, mergedFilters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    void getSales(1, initialFilters);
  };

  const changePage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), pagination.totalPages);

    setPage(safePage);
    void getSales(safePage, filters);
  };

  return {
    sales,
    pagination,
    filters,
    page,
    limit,
    loading,
    error,
    metrics,
    getSales,
    updateFilters,
    resetFilters,
    changePage,
  };
};
