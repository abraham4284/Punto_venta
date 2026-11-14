import { useEffect, useState } from "react";
import { getStockCategoryOptionsRequest } from "../api/stock.api";
import type { StockCategoryOption } from "../types/stock.types";

export const useStockCategoryOptions = (enabled: boolean) => {
  const [options, setOptions] = useState<StockCategoryOption[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void getStockCategoryOptionsRequest(controller.signal).then(({ data }) => {
      if (!Array.isArray(data.data)) throw new Error("Respuesta de categorías inválida");
      if (!controller.signal.aborted) setOptions(data.data);
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [enabled, attempt]);

  const retry = () => {
    setLoading(true);
    setError(false);
    setAttempt((current) => current + 1);
  };

  return { options, loading, error, retry };
};
