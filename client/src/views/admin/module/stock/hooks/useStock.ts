import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { getCriticalStockReportRequest, getStockRequest } from "../api/stock.api";
import type {
  ApiErrorResponse,
  CriticalStockReportResponse,
  FieldError,
  StockResponse,
} from "../types/stock.types";

export const useStock = () => {
  const [stock, setStock] = useState<StockResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [search, setSearch] = useState("");
  const [criticalStockData, setCriticalStockData] = useState<
    CriticalStockReportResponse[]
  >([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [maxQuantityFilter, setMaxQuantityFilter] = useState(10);
  const [depositFilter, setDepositFilter] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const clearErrors = () => {
    setError(null);
    setFieldErrors([]);
  };

  const handleApiError = (error: unknown): FieldError[] => {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    const message =
      axiosError.response?.data?.message || "Ocurrió un error inesperado";

    const errors = axiosError.response?.data?.errors ?? [];

    setError(message);
    setFieldErrors(errors);

    return errors;
  };

  const getStock = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();

      const response = await getStockRequest();

      setStock(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCriticalStockReport = useCallback(async () => {
    try {
      setLoadingReport(true);
      clearErrors();

      const response = await getCriticalStockReportRequest({
        maxQuantity: maxQuantityFilter,
        idDeposit: depositFilter,
        search: productSearch,
      });

      setCriticalStockData(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingReport(false);
    }
  }, [depositFilter, maxQuantityFilter, productSearch]);

  const filteredStock = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return stock;

    return stock.filter((stockItem) => {
      return (
        stockItem.productName.toLowerCase().includes(value) ||
        stockItem.depositName?.toLowerCase().includes(value)
      );
    });
  }, [stock, search]);

  const metrics = useMemo(() => {
    const total = stock.length;

    return {
      total,
    };
  }, [stock]);

  const criticalMetrics = useMemo(() => {
    const zeroStock = criticalStockData.filter((item) => {
      return item.alertStatus === "CRITICAL_ZERO";
    }).length;

    const insufficientStock = criticalStockData.filter((item) => {
      return (
        item.alertStatus === "CRITICAL_LOW" ||
        item.alertStatus === "CRITICAL_EQUAL"
      );
    }).length;

    const totalCriticalRisk = zeroStock + insufficientStock;

    return {
      totalCriticalRisk,
      zeroStock,
      insufficientStock,
    };
  }, [criticalStockData]);

  const resetStock = () => {
    setLoading(false);
    setError(null);
    setStock([]);
    setCriticalStockData([]);
  };

  return {
    filteredStock,
    metrics,
    stock,
    loading,
    error,
    fieldErrors,
    criticalStockData,
    criticalMetrics,
    loadingReport,
    maxQuantityFilter,
    depositFilter,
    productSearch,
    search,
    setSearch,
    setMaxQuantityFilter,
    setDepositFilter,
    setProductSearch,
    clearErrors,
    getStock,
    getCriticalStockReport,
    resetStock,
  };
};
