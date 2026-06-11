import { useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { getSaleByIdRequest } from "../api/sales.api";
import type { ApiErrorResponse, SaleWithDetailsResponse } from "../types";
import { Decimal } from "decimal.js";

export const useSaleDetails = () => {
  const [sale, setSale] = useState<SaleWithDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSale = async (idSale: string) => {
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
  };

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

  const resetSaleDetails = ()=>{
    setSale(null);
    setLoading(false);
    setError(null);
  }

  return {
    sale,
    loading,
    error,
    getSale,
    grossSubtotal,
    resetSaleDetails,
  };
};
