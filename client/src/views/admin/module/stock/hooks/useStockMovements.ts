import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { getStockMovementsRequest } from "../api/stock.movement.api";
import type {
  ApiErrorResponse,
  StockMovementFilter,
  StockMovementMetrics,
  StockMovementResponse,
  StockMovementType,
} from "../types";

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

const transferTypes: StockMovementType[] = ["TRANSFER_IN", "TRANSFER_OUT"];

const isEntryMovement = (movementType: StockMovementType): boolean => {
  return entryTypes.includes(movementType);
};

const isOutputMovement = (movementType: StockMovementType): boolean => {
  return outputTypes.includes(movementType);
};

const isTransferMovement = (movementType: StockMovementType): boolean => {
  return transferTypes.includes(movementType);
};

export const useStockMovements = () => {
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockMovementFilter>("ALL");

  const clearError = () => {
    setError(null);
  };

  const handleApiError = (error: unknown) => {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    setError(
      axiosError.response?.data?.message ||
        "No se pudo cargar el historial de movimientos",
    );
  };

  const getStockMovements = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      const response = await getStockMovementsRequest();

      setMovements(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredMovements = useMemo(() => {
    const value = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesText =
        !value ||
        movement.productName.toLowerCase().includes(value) ||
        movement.userName.toLowerCase().includes(value);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "IN" && isEntryMovement(movement.movementType)) ||
        (filter === "OUT" && isOutputMovement(movement.movementType)) ||
        (filter === "TRANSFER" && isTransferMovement(movement.movementType));

      return matchesText && matchesFilter;
    });
  }, [filter, movements, search]);

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
        total: movements.length,
        entriesVolume: 0,
        outputsVolume: 0,
      },
    );
  }, [movements]);

  const resetStockMovements = () => {
    setMovements([]);
    setLoading(false);
    setError(null);
    setSearch("");
    setFilter("ALL");
  };

  return {
    movements,
    filteredMovements,
    metrics,
    loading,
    error,
    search,
    filter,
    setSearch,
    setFilter,
    getStockMovements,
    resetStockMovements,
  };
};
