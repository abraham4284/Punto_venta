import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { getCurrentCashSessionRequest } from "../../cash/api/cash.api";
import type { CashSessionResponse } from "../../cash/types";
import { getPaymentMethodsRequest } from "../../payment-methods/api/payment-methods.api";
import type { PaymentMethodResponse } from "../../payment-methods/types";
import {
  cancelSalePaymentRequest,
  collectSalePaymentRequest,
  confirmSalePaymentRequest,
  createSalePaymentRequest,
  getCollectPaymentMethodsRequest,
  getSalePaymentsRequest,
  updateSalePaymentRequest,
} from "../api/sale-payments.api";
import { getSalePaymentErrorMessage } from "../helpers/sale-payment.helpers";
import type {
  CollectPaymentMethodResponse,
  CreateSalePaymentBody,
  SalePaymentActionBody,
  SalePaymentResponse,
  UpdateSalePaymentBody,
} from "../types";

type ApiError = {
  message?: string;
};

type UseSalePaymentsOptions = {
  idSale: number;
  enabled: boolean;
  loadAdminPaymentMethods?: boolean;
  onPaymentChanged?: () => Promise<void> | void;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;

  return getSalePaymentErrorMessage(
    axiosError.response?.data?.message ?? axiosError.message,
    fallback,
  );
};

export const useSalePayments = ({
  idSale,
  enabled,
  loadAdminPaymentMethods = false,
  onPaymentChanged,
}: UseSalePaymentsOptions) => {
  const [payments, setPayments] = useState<SalePaymentResponse[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [collectPaymentMethods, setCollectPaymentMethods] = useState<
    CollectPaymentMethodResponse[]
  >([]);
  const [currentCashSession, setCurrentCashSession] =
    useState<CashSessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [collectMethodsLoading, setCollectMethodsLoading] = useState(false);
  const [collectMethodsLoaded, setCollectMethodsLoaded] = useState(false);
  const [cashSessionLoading, setCashSessionLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncParent = useCallback(async () => {
    await onPaymentChanged?.();
  }, [onPaymentChanged]);

  const replacePayment = useCallback((payment: SalePaymentResponse) => {
    setPayments((current) => {
      const exists = current.some((item) => item.idSalePayment === payment.idSalePayment);

      if (!exists) {
        return [...current, payment];
      }

      return current.map((item) =>
        item.idSalePayment === payment.idSalePayment ? payment : item,
      );
    });
  }, []);

  const fetchPayments = useCallback(async () => {
    if (!enabled) {
      setPayments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data } = await getSalePaymentsRequest(idSale);
      setPayments(data.data ?? []);
    } catch (error) {
      const message = getErrorMessage(error, "No se pudieron cargar los pagos");
      setError(message);
      toast.error(message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, idSale]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setMethodsLoading(true);
      const { data } = await getPaymentMethodsRequest(true);
      setPaymentMethods(data.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar los métodos de pago"));
      setPaymentMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  }, []);

  const fetchCollectPaymentMethods = useCallback(async () => {
    try {
      setCollectMethodsLoading(true);
      const { data } = await getCollectPaymentMethodsRequest();
      setCollectPaymentMethods(data.data ?? []);
      setCollectMethodsLoaded(true);
      return data.data ?? [];
    } catch (error) {
      toast.error(
        getErrorMessage(error, "No se pudieron cargar los métodos de cobro"),
      );
      setCollectPaymentMethods([]);
      setCollectMethodsLoaded(true);
      return [];
    } finally {
      setCollectMethodsLoading(false);
    }
  }, []);

  const fetchCurrentCashSession = useCallback(async () => {
    try {
      setCashSessionLoading(true);
      const { data } = await getCurrentCashSessionRequest();
      setCurrentCashSession(data.data ?? null);
      return data.data ?? null;
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo validar la caja abierta"));
      setCurrentCashSession(null);
      return null;
    } finally {
      setCashSessionLoading(false);
    }
  }, []);

  const createPayment = useCallback(
    async (body: CreateSalePaymentBody): Promise<boolean> => {
      try {
        setSaving(true);
        setError(null);

        const { data } = await createSalePaymentRequest(idSale, body);
        replacePayment(data.data);
        toast.success(data.message);
        await syncParent();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo registrar el pago"));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [idSale, replacePayment, syncParent],
  );

  const updatePayment = useCallback(
    async (
      idSalePayment: number,
      body: UpdateSalePaymentBody,
    ): Promise<boolean> => {
      try {
        setActionLoadingId(idSalePayment);
        setError(null);

        const { data } = await updateSalePaymentRequest(idSalePayment, body);
        replacePayment(data.data);
        toast.success(data.message);
        await syncParent();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo actualizar el pago"));
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [replacePayment, syncParent],
  );

  const cancelPayment = useCallback(
    async (
      idSalePayment: number,
      body: Pick<SalePaymentActionBody, "reason">,
    ): Promise<boolean> => {
      try {
        setActionLoadingId(idSalePayment);
        setError(null);

        const { data } = await cancelSalePaymentRequest(idSalePayment, body);
        replacePayment(data.data);
        toast.success(data.message);
        await syncParent();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo anular el pago"));
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [replacePayment, syncParent],
  );

  const collectPayment = useCallback(
    async (
      idSalePayment: number,
      body: Pick<SalePaymentActionBody, "idPaymentMethod" | "observation">,
    ): Promise<boolean> => {
      try {
        setActionLoadingId(idSalePayment);
        setError(null);

        const { data } = await collectSalePaymentRequest(idSalePayment, body);
        replacePayment(data.data);
        toast.success(data.message);
        await syncParent();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo registrar el cobro"));
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [replacePayment, syncParent],
  );

  const confirmPayment = useCallback(
    async (idSalePayment: number, idCashSession: number): Promise<boolean> => {
      try {
        setActionLoadingId(idSalePayment);
        setError(null);

        const { data } = await confirmSalePaymentRequest(idSalePayment, {
          idCashSession,
        });
        replacePayment(data.data);
        toast.success(data.message);
        await syncParent();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudo confirmar el pago"));
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [replacePayment, syncParent],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPayments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPayments]);

  useEffect(() => {
    if (!enabled || !loadAdminPaymentMethods) return;

    const timeoutId = window.setTimeout(() => {
      void fetchPaymentMethods();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, fetchPaymentMethods, loadAdminPaymentMethods]);

  return {
    payments,
    paymentMethods,
    collectPaymentMethods,
    collectMethodsLoaded,
    currentCashSession,
    loading,
    methodsLoading,
    collectMethodsLoading,
    cashSessionLoading,
    actionLoadingId,
    saving,
    error,
    fetchPayments,
    fetchPaymentMethods,
    fetchCollectPaymentMethods,
    fetchCurrentCashSession,
    createPayment,
    updatePayment,
    cancelPayment,
    collectPayment,
    confirmPayment,
  };
};
