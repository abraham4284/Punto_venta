import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { getStockMovementsRequest } from "../api/stock.movement.api";
import type {
  ApiErrorResponse,
  StockMovementFilter,
  StockMovementMetrics,
  StockMovementResponse,
  StockMovementType,
} from "../types";

const PAGE_LIMIT = 15;

const entryTypes: StockMovementType[] = [
  "PURCHASE",
  "TRANSFER_IN",
  "ADJUSTMENT_IN",
];

const outputTypes: StockMovementType[] = [
  "SALE",
  "TRANSFER_OUT",
  "ADJUSTMENT_OUT",
];

const isEntryMovement = (movementType: StockMovementType): boolean => {
  return entryTypes.includes(movementType);
};

const isOutputMovement = (movementType: StockMovementType): boolean => {
  return outputTypes.includes(movementType);
};

export const useStockMovements = () => {
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockMovementFilter>("ALL");
  const [depositFilter, setDepositFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const handleApiError = (requestError: unknown) => {
    const axiosError = requestError as AxiosError<ApiErrorResponse>;

    setError(
      axiosError.response?.data?.message ||
        "No se pudo cargar el historial de movimientos",
    );
  };

  const getStockMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getStockMovementsRequest({
        page: currentPage,
        limit: PAGE_LIMIT,
        movementType: filter,
        idDeposit: depositFilter,
        search,
      });
      const responseData = response.data.data;

      setMovements(responseData?.movements ?? []);
      setTotalPages(responseData?.pagination.totalPages ?? 0);
      setTotalRecords(responseData?.pagination.totalRecords ?? 0);
    } catch (requestError) {
      handleApiError(requestError);
    } finally {
      setLoading(false);
    }
  }, [currentPage, depositFilter, filter, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      getStockMovements();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [getStockMovements]);

  const metrics = useMemo<StockMovementMetrics>(() => {
    return movements.reduce<StockMovementMetrics>(
      (acc, movement) => {
        if (isEntryMovement(movement.movementType)) {
          acc.entriesVolume += movement.quantity;
        }

        if (isOutputMovement(movement.movementType)) {
          acc.outputsVolume += movement.quantity;
        }

        return acc;
      },
      {
        total: totalRecords,
        entriesVolume: 0,
        outputsVolume: 0,
      },
    );
  }, [movements, totalRecords]);

  const changeSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const changeFilter = (value: StockMovementFilter) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const changeDepositFilter = (value: number | null) => {
    setDepositFilter(value);
    setCurrentPage(1);
  };

  const changePage = (page: number) => {
    const maximumPage = Math.max(totalPages, 1);
    setCurrentPage(Math.min(Math.max(page, 1), maximumPage));
  };

  const resetStockMovements = () => {
    setMovements([]);
    setLoading(false);
    setError(null);
    setSearch("");
    setFilter("ALL");
    setDepositFilter(null);
    setCurrentPage(1);
    setTotalPages(0);
    setTotalRecords(0);
  };

  return {
    movements,
    metrics,
    loading,
    error,
    search,
    filter,
    depositFilter,
    currentPage,
    totalPages,
    totalRecords,
    limit: PAGE_LIMIT,
    setSearch: changeSearch,
    setFilter: changeFilter,
    setDepositFilter: changeDepositFilter,
    setCurrentPage: changePage,
    getStockMovements,
    resetStockMovements,
  };
};
