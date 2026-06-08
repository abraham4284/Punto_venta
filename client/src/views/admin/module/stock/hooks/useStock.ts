import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import type {} from "@/api/axios.response.type";
import { getStockRequest } from "../api/stock.api";
import type {
  ApiErrorResponse,
  FieldError,
} from "../../deposits/types/deposits.types";
import type { StockResponse } from "../types/stock.types";
// import type {
//   ApiErrorResponse,
//   CreateDepositBody,
//   DepositResponse,
//   FieldError,
//   UpdateDepositBody,
// } from "../types/deposits.types";

type MutationResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

export const useStock = () => {
  const [stock, setStock] = useState<StockResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [search, setSearch] = useState("");

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

  const resetStock = () => {
    setLoading(false);
    setError(null);
    setStock([]);
  };

  return {
    // deposits,
    filteredStock,
    metrics,
    stock,
    loading,
    error,
    fieldErrors,
    search,
    setSearch,
    clearErrors,
    getStock,
    resetStock,
  };
};
