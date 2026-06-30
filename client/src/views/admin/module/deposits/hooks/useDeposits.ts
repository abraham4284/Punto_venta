import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import {
  createDepositRequest,
  getDepositsRequest,
  updateDepositRequest,
} from "../api/deposits.api";
import type {
  ApiErrorResponse,
  CreateDepositBody,
  DepositResponse,
  FieldError,
  UpdateDepositBody,
} from "../types/deposits.types";

type MutationResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

export const useDeposits = () => {
  const [deposits, setDeposits] = useState<DepositResponse[]>([]);
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

  const getDeposits = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();

      const response = await getDepositsRequest();

      setDeposits(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeposit = async (
    body: CreateDepositBody,
  ): Promise<MutationResult> => {
    try {
      clearErrors();

      const response = await createDepositRequest(body);

      await getDeposits();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo crear el depósito",
        errors,
      };
    }
  };

  const updateDeposit = async (
    idDeposit: number,
    body: UpdateDepositBody,
  ): Promise<MutationResult> => {
    try {
      clearErrors();

      const response = await updateDepositRequest(idDeposit, body);

      await getDeposits();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo actualizar el depósito",
        errors,
      };
    }
  };

  const toggleDepositStatus = async (
    deposit: DepositResponse,
  ): Promise<MutationResult> => {
    return updateDeposit(deposit.idDeposit, {
      isActive: !deposit.isActive,
    });
  };

  const toggleDepositDefault = async (
    deposit: DepositResponse,
  ): Promise<MutationResult> => {
    return updateDeposit(deposit.idDeposit, {
      isDefault: !deposit.isDefault,
    });
  };

  const filteredDeposits = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return deposits;

    return deposits.filter((deposit) => {
      return (
        deposit.name.toLowerCase().includes(value) ||
        deposit.description?.toLowerCase().includes(value)
      );
    });
  }, [deposits, search]);

  const metrics = useMemo(() => {
    const total = deposits.length;
    const active = deposits.filter((deposit) => deposit.isActive).length;
    const inactive = deposits.filter((deposit) => !deposit.isActive).length;
    const defaultDeposit = deposits.find((deposit) => deposit.isDefault);

    return {
      total,
      active,
      inactive,
      defaultDepositName: defaultDeposit?.name ?? "Sin predeterminado",
    };
  }, [deposits]);

  const resetDeposits = useCallback(() => {
    setLoading(false);
    setError(null);
    setDeposits([]);
  }, []);

  return {
    deposits,
    filteredDeposits,
    metrics,
    loading,
    error,
    fieldErrors,
    search,
    setSearch,
    clearErrors,
    getDeposits,
    createDeposit,
    updateDeposit,
    toggleDepositStatus,
    toggleDepositDefault,
    resetDeposits,
  };
};
