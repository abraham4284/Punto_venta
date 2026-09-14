import { useCallback, useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { cancelSale, getSalesRequest } from "../api/sales.api";
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
  idPaymentMethod: null,
  status: null,
  paymentStatus: null,
  deliveryStatus: null,
  settlementStatus: null,
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
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saleNumberDebounceRef = useRef<number | null>(null);

  const getSales = useCallback(
    async (nextPage = 1, nextFilters = initialFilters) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getSalesRequest(nextPage, limit, nextFilters);
        const responseData = response.data.data;

        setSales(responseData.sales);
        setPagination(responseData.pagination);
        setMetrics(responseData.metrics);
        setPage(responseData.pagination.currentPage);

        return responseData;
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        setError(
          axiosError.response?.data?.message ||
            "No se pudieron cargar las ventas",
        );

        return null;
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
    const shouldDebounce =
      Object.keys(nextFilters).length === 1 &&
      Object.prototype.hasOwnProperty.call(nextFilters, "saleNumber");

    setFilters(mergedFilters);
    setPage(1);

    if (saleNumberDebounceRef.current !== null) {
      window.clearTimeout(saleNumberDebounceRef.current);
    }

    if (shouldDebounce) {
      saleNumberDebounceRef.current = window.setTimeout(() => {
        void getSales(1, mergedFilters);
      }, 350);
      return;
    }

    void getSales(1, mergedFilters);
  };

  const resetFilters = () => {
    if (saleNumberDebounceRef.current !== null) {
      window.clearTimeout(saleNumberDebounceRef.current);
    }

    setFilters(initialFilters);
    setPage(1);
    void getSales(1, initialFilters);
  };

  const changePage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), pagination.totalPages);

    setPage(safePage);
    void getSales(safePage, filters);
  };

  const cancelSaleAction = async (idSale: number) => {
    const saleToCancel = sales.find((sale) => sale.idSale === idSale);

    if (!saleToCancel || saleToCancel.status === "CANCELLED") return;

    try {
      setCancelingId(idSale);
      setError(null);

      await cancelSale(idSale);

      const refreshedData = await getSales(page, filters);

      if (
        refreshedData &&
        refreshedData.sales.length === 0 &&
        refreshedData.pagination.currentPage > 1
      ) {
        await getSales(refreshedData.pagination.currentPage - 1, filters);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "No se pudo anular la venta",
      );
    } finally {
      setCancelingId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (saleNumberDebounceRef.current !== null) {
        window.clearTimeout(saleNumberDebounceRef.current);
      }
    };
  }, []);

  return {
    sales,
    pagination,
    filters,
    page,
    limit,
    loading,
    cancelingId,
    error,
    metrics,
    getSales,
    updateFilters,
    resetFilters,
    changePage,
    cancelSaleAction,
  };
};
