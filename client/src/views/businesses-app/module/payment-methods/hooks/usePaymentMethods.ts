import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import {
  changePaymentMethodStatusRequest,
  createPaymentMethodRequest,
  getPaymentMethodsRequest,
  setDefaultPaymentMethodRequest,
  updatePaymentMethodRequest,
} from "../api/payment-methods.api";
import type {
  ApiErrorResponse,
  CreatePaymentMethodBody,
  FieldError,
  MutationResult,
  PaymentMethodResponse,
  UpdatePaymentMethodBody,
} from "../types";

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [search, setSearch] = useState("");

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors([]);
  }, []);

  const handleApiError = useCallback((error: unknown): FieldError[] => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message =
      axiosError.response?.data?.message || "Ocurrio un error inesperado";
    const errors = axiosError.response?.data?.errors ?? [];

    setError(message);
    setFieldErrors(errors);

    return errors;
  }, []);

  const getPaymentMethods = useCallback(
    async (onlyActive = false): Promise<PaymentMethodResponse[]> => {
      try {
        setLoading(true);
        clearErrors();

        const response = await getPaymentMethodsRequest(onlyActive);
        const data = response.data.data ?? [];
        setPaymentMethods(data);

        return data;
      } catch (requestError) {
        handleApiError(requestError);
        setPaymentMethods([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [clearErrors, handleApiError],
  );

  const createPaymentMethod = async (
    body: CreatePaymentMethodBody,
  ): Promise<MutationResult> => {
    try {
      setSaving(true);
      clearErrors();

      const response = await createPaymentMethodRequest(body);
      await getPaymentMethods();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (requestError) {
      const errors = handleApiError(requestError);
      return {
        status: false,
        message: "No se pudo crear el metodo de pago",
        errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentMethod = async (
    idPaymentMethod: number,
    body: UpdatePaymentMethodBody,
  ): Promise<MutationResult> => {
    try {
      setSaving(true);
      clearErrors();

      const response = await updatePaymentMethodRequest(idPaymentMethod, body);
      await getPaymentMethods();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (requestError) {
      const errors = handleApiError(requestError);
      return {
        status: false,
        message: "No se pudo actualizar el metodo de pago",
        errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethodStatus = async (
    paymentMethod: PaymentMethodResponse,
  ): Promise<MutationResult> => {
    try {
      setSaving(true);
      clearErrors();

      const response = await changePaymentMethodStatusRequest(
        paymentMethod.idPaymentMethod,
        { isActive: !paymentMethod.isActive },
      );
      await getPaymentMethods();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (requestError) {
      const errors = handleApiError(requestError);
      return {
        status: false,
        message: "No se pudo cambiar el estado",
        errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPaymentMethod = async (
    paymentMethod: PaymentMethodResponse,
  ): Promise<MutationResult> => {
    try {
      setSaving(true);
      clearErrors();

      const response = await setDefaultPaymentMethodRequest(
        paymentMethod.idPaymentMethod,
      );
      await getPaymentMethods();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (requestError) {
      const errors = handleApiError(requestError);
      return {
        status: false,
        message: "No se pudo marcar como predeterminado",
        errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const filteredPaymentMethods = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return paymentMethods;

    return paymentMethods.filter((paymentMethod) => {
      return (
        paymentMethod.name.toLowerCase().includes(value) ||
        paymentMethod.code.toLowerCase().includes(value)
      );
    });
  }, [paymentMethods, search]);

  const activePaymentMethods = useMemo(() => {
    return paymentMethods.filter((paymentMethod) => paymentMethod.isActive);
  }, [paymentMethods]);

  return {
    paymentMethods,
    filteredPaymentMethods,
    activePaymentMethods,
    loading,
    saving,
    error,
    fieldErrors,
    search,
    setSearch,
    clearErrors,
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethodStatus,
    setDefaultPaymentMethod,
  };
};
