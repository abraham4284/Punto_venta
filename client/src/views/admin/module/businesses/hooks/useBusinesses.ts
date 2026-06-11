import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import { useAuthStore } from "../../auth/store/auth.store";
import { getBusinessRequest, updateBusinessRequest } from "../api/businesses.api";
import type {
  ApiErrorResponse,
  BusinessResponse,
  FieldError,
  UpdateBusinessBody,
} from "../types";

type MutationResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

export const useBusinesses = () => {
  const user = useAuthStore((state) => state.user);
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
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

  const getBusiness = useCallback(async () => {
    if (!user?.idBusiness) {
      setError("No hay un negocio asociado al usuario autenticado");
      return;
    }

    try {
      setLoading(true);
      clearErrors();

      const response = await getBusinessRequest();

      setBusiness(response.data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [user?.idBusiness]);

  const updateBusiness = async (
    body: UpdateBusinessBody,
  ): Promise<MutationResult> => {
    try {
      setSaving(true);
      clearErrors();

      const response = await updateBusinessRequest(body);

      setBusiness(response.data.data);

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo actualizar el negocio",
        errors,
      };
    } finally {
      setSaving(false);
    }
  };

  const resetBusiness = () => {
    setBusiness(null);
    setLoading(false);
    setSaving(false);
    clearErrors();
  };

  return {
    business,
    loading,
    saving,
    error,
    fieldErrors,
    user,
    getBusiness,
    updateBusiness,
    resetBusiness,
    clearErrors,
  };
};
