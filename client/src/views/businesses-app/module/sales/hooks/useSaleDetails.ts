import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { cancelSale, getSaleByIdRequest } from "../api/sales.api";
import type { ApiErrorResponse, SaleWithDetailsResponse } from "../types";
import { Decimal } from "decimal.js";

export const useSaleDetails = () => {
  const [sale, setSale] = useState<SaleWithDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSale = useCallback(async (idSale: string) => {
    try {
      const saleId = Number(idSale);

      if (!Number.isInteger(saleId) || saleId <= 0) {
        setError("La venta indicada no es valida");
        return;
      }

      setLoading(true);
      setError(null);

      const response = await getSaleByIdRequest(saleId);

      setSale(response.data.data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "No se pudo cargar la venta",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const grossSubtotal = useMemo(() => {
    if (!sale) return 0;

    return Number(
      sale.items
        .reduce((acc, item) => {
          return acc.plus(new Decimal(item.unitPrice).mul(item.quantity));
        }, new Decimal(0))
        .toDecimalPlaces(2)
        .toString(),
    );
  }, [sale]);

  const resetSaleDetails = useCallback(() => {
    setSale(null);
    setLoading(false);
    setCanceling(false);
    setError(null);
  }, []);

  const cancelSaleAction = useCallback(async (idSale: number) => {
    try {
      setCanceling(true);
      setError(null);

      await cancelSale(idSale);

      setSale((currentSale) => {
        if (!currentSale) return currentSale;

        return {
          ...currentSale,
          status: "CANCELLED",
        };
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "No se pudo anular la venta",
      );
    } finally {
      setCanceling(false);
    }
  }, []);

  return {
    sale,
    loading,
    canceling,
    error,
    getSale,
    cancelSaleAction,
    grossSubtotal,
    resetSaleDetails,
  };
};
