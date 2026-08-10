import { useCallback, useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { createIdempotencyKey } from "@/helpers/idempotency.helper";
import {
  cancelPurchaseApi,
  createPurchaseApi,
  getPurchaseByIdApi,
  getPurchasesApi,
} from "../api/purchases.api";
import type {
  ApiErrorResponse,
  CreatePurchasePayload,
  FieldError,
  PaginatedPurchasesResponse,
  PurchaseCartItem,
  PurchaseFilters,
  PurchaseResponse,
  PurchaseWithDetailsResponse,
} from "../types";

const initialFilters: PurchaseFilters = {
  page: 1,
  limit: 10,
  purchaseNumber: "",
  idSupplier: null,
  idDeposit: null,
  status: null,
  startDate: "",
  endDate: "",
};

const initialPaginatedData: PaginatedPurchasesResponse = {
  purchases: [],
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  },
  metrics: {
    total: 0,
    completed: 0,
    completedPercentage: 0,
    cancelled: 0,
    cancelledPercentage: 0,
    completedTotal: 0,
  },
};

const getApiErrors = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  return {
    message: axiosError.response?.data?.message || fallback,
    errors: axiosError.response?.data?.errors ?? [],
  };
};

export const usePurchases = () => {
  const [cart, setCart] = useState<PurchaseCartItem[]>([]);
  const [filters, setFilters] = useState<PurchaseFilters>(initialFilters);
  const [data, setData] =
    useState<PaginatedPurchasesResponse>(initialPaginatedData);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseWithDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const submitLockRef = useRef(false);
  const currentPurchaseIdempotencyKeyRef = useRef<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const discountTotal = cart.reduce((acc, item) => acc + item.discountAmount, 0);
    const total = Math.max(subtotal - discountTotal, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [cart]);

  const addToCart = (item: PurchaseCartItem) => {
    setCart((current) => {
      const existingIndex = current.findIndex(
        (cartItem) =>
          cartItem.idProduct === item.idProduct &&
          cartItem.idDeposit === item.idDeposit,
      );

      if (existingIndex < 0) return [...current, item];

      return current.map((cartItem, index) => {
        if (index !== existingIndex) return cartItem;

        const quantity = cartItem.quantity + item.quantity;
        const discountAmount = cartItem.discountAmount + item.discountAmount;
        const subtotal = quantity * item.unitPrice - discountAmount;

        return {
          ...cartItem,
          quantity,
          unitPrice: item.unitPrice,
          discountAmount: Number(discountAmount.toFixed(2)),
          subtotal: Number(subtotal.toFixed(2)),
        };
      });
    });
  };

  const removeFromCart = (idProduct: number, idDeposit: number) => {
    setCart((current) =>
      current.filter(
        (item) => item.idProduct !== idProduct || item.idDeposit !== idDeposit,
      ),
    );
  };

  const updateCartItem = (
    idProduct: number,
    idDeposit: number,
    nextItem: Partial<PurchaseCartItem>,
  ) => {
    setCart((current) =>
      current.map((item) => {
        if (item.idProduct !== idProduct || item.idDeposit !== idDeposit) {
          return item;
        }

        const quantity = nextItem.quantity ?? item.quantity;
        const unitPrice = nextItem.unitPrice ?? item.unitPrice;
        const discountAmount = nextItem.discountAmount ?? item.discountAmount;

        return {
          ...item,
          ...nextItem,
          quantity,
          unitPrice,
          discountAmount,
          subtotal: Number((quantity * unitPrice - discountAmount).toFixed(2)),
        };
      }),
    );
  };

  const clearCart = () => setCart([]);

  const fetchPurchases = useCallback(async (nextFilters?: PurchaseFilters) => {
    try {
      const requestFilters = nextFilters ?? initialFilters;
      setLoading(true);
      setError(null);
      const response = await getPurchasesApi(requestFilters);
      const responseData = response.data.data;
      setData(responseData);
      setFilters(requestFilters);

      if (responseData.purchases.length === 0) {
        toast.error("No se encontraron compras con los criterios seleccionados");
      }
    } catch (error) {
      const result = getApiErrors(error, "No se pudieron cargar las compras");
      setError(result.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const changePage = (page: number) => {
    const safePage = Math.min(Math.max(page, 1), data.pagination.totalPages);
    void fetchPurchases({ ...filters, page: safePage });
  };

  const fetchPurchaseById = useCallback(async (idPurchase: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPurchaseByIdApi(idPurchase);
      setSelectedPurchase(response.data.data);
    } catch (error) {
      const result = getApiErrors(error, "No se pudo cargar la compra");
      setError(result.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitPurchase = async (
    payload: CreatePurchasePayload,
  ): Promise<{ status: boolean; message: string; errors?: FieldError[]; processing?: boolean }> => {
    if (submitLockRef.current) {
      return {
        status: false,
        processing: true,
        message: "La compra ya se esta procesando.",
      };
    }

    submitLockRef.current = true;
    currentPurchaseIdempotencyKeyRef.current =
      currentPurchaseIdempotencyKeyRef.current ?? createIdempotencyKey();

    try {
      setSaving(true);
      setFieldErrors([]);
      setError(null);
      const response = await createPurchaseApi(
        payload,
        currentPurchaseIdempotencyKeyRef.current,
      );
      currentPurchaseIdempotencyKeyRef.current = null;
      clearCart();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const result = getApiErrors(error, "No se pudo registrar la compra");
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        currentPurchaseIdempotencyKeyRef.current = null;
      }

      setError(result.message);
      setFieldErrors(result.errors);

      return {
        status: false,
        message: result.message,
        errors: result.errors,
      };
    } finally {
      submitLockRef.current = false;
      setSaving(false);
    }
  };

  const cancelPurchase = async (idPurchase: number) => {
    try {
      setCancelingId(idPurchase);
      setError(null);
      const response = await cancelPurchaseApi(idPurchase);
      const updated = response.data.data;

      setData((current) => ({
        ...current,
        purchases: current.purchases.map((purchase) =>
          purchase.idPurchase === idPurchase
            ? ({ ...purchase, status: "CANCELLED" } as PurchaseResponse)
            : purchase,
        ),
      }));
      setSelectedPurchase((current) =>
        current?.idPurchase === idPurchase ? updated : current,
      );
    } catch (error) {
      const result = getApiErrors(error, "No se pudo anular la compra");
      setError(result.message);
      toast.error(result.message);
    } finally {
      setCancelingId(null);
    }
  };

  const resetPurchases = useCallback(() => {
    submitLockRef.current = false;
    currentPurchaseIdempotencyKeyRef.current = null;
    setCart([]);
    setFilters(initialFilters);
    setData(initialPaginatedData);
    setSelectedPurchase(null);
    setLoading(false);
    setSaving(false);
    setCancelingId(null);
    setError(null);
    setFieldErrors([]);
  }, []);

  return {
    cart,
    totals,
    purchases: data.purchases,
    pagination: data.pagination,
    metrics: data.metrics,
    filters,
    selectedPurchase,
    loading,
    saving,
    cancelingId,
    error,
    fieldErrors,
    setFilters,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    fetchPurchases,
    changePage,
    fetchPurchaseById,
    submitPurchase,
    cancelPurchase,
    resetPurchases,
  };
};
