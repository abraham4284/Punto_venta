import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import {
  createSupplierRequest,
  getSuppliersRequest,
  updateSupplierRequest,
} from "../api/suppliers.api";
import type {
  ApiErrorResponse,
  CreateSupplierBody,
  FieldError,
  SupplierResponse,
  UpdateSupplierBody,
} from "../types";

type MutationResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const clearErrors = () => {
    setError(null);
    setFieldErrors([]);
  };

  const handleApiError = (error: unknown): FieldError[] => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message =
      axiosError.response?.data?.message || "Ocurrio un error inesperado";
    const errors = axiosError.response?.data?.errors ?? [];

    setError(message);
    setFieldErrors(errors);

    return errors;
  };

  const getSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();

      const response = await getSuppliersRequest();
      setSuppliers(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = async (
    body: CreateSupplierBody,
  ): Promise<MutationResult> => {
    try {
      setSaving(true);
      clearErrors();

      const response = await createSupplierRequest(body);
      await getSuppliers();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo crear el proveedor",
        errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const updateSupplier = async (
    idSupplier: number,
    body: UpdateSupplierBody,
  ): Promise<MutationResult> => {
    try {
      setSaving(true);
      clearErrors();

      const response = await updateSupplierRequest(idSupplier, body);
      await getSuppliers();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo actualizar el proveedor",
        errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const toggleSupplierStatus = async (
    supplier: SupplierResponse,
  ): Promise<MutationResult> => {
    return updateSupplier(supplier.idSupplier, {
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      observation: supplier.observation,
      isActive: !supplier.isActive,
    });
  };

  const metrics = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((supplier) => supplier.isActive).length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
    };
  }, [suppliers]);

  const resetSuppliers = useCallback(() => {
    setLoading(false);
    setSaving(false);
    setError(null);
    setFieldErrors([]);
    setSuppliers([]);
  }, []);

  return {
    suppliers,
    loading,
    saving,
    error,
    fieldErrors,
    metrics,
    clearErrors,
    getSuppliers,
    createSupplier,
    updateSupplier,
    toggleSupplierStatus,
    resetSuppliers,
  };
};
