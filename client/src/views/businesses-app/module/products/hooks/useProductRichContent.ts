import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";

import {
  getProductByIdRequest,
  updateProductRequest,
} from "../api/products.api";
import type { ProductRichContent } from "../types/product-rich-content.types";
import type { ApiErrorResponse } from "../types/products.types";

export const useProductRichContent = () => {
  const [richContent, setRichContent] = useState<ProductRichContent | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (requestError: unknown): string => {
    const axiosError = requestError as AxiosError<ApiErrorResponse>;

    return (
      axiosError.response?.data?.message ||
      axiosError.message ||
      "No se pudo procesar el contenido detallado"
    );
  };

  const loadRichContent = useCallback(
    async (idProduct: number): Promise<ProductRichContent | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await getProductByIdRequest(idProduct);
        const nextRichContent = response.data.data.richContent ?? null;

        setRichContent(nextRichContent);

        return nextRichContent;
      } catch (requestError) {
        const message = getErrorMessage(requestError);

        setError(message);
        toast.error(message);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const saveRichContent = useCallback(
    async (
      idProduct: number,
      nextRichContent: ProductRichContent | null,
    ): Promise<ProductRichContent | null> => {
      try {
        setSaving(true);
        setError(null);

        const response = await updateProductRequest(idProduct, {
          richContent: nextRichContent,
        });
        const savedRichContent = response.data.data.richContent ?? null;

        setRichContent(savedRichContent);
        toast.success("Contenido detallado actualizado correctamente");

        return savedRichContent;
      } catch (requestError) {
        const message = getErrorMessage(requestError);

        setError(message);
        toast.error(message);

        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setRichContent(null);
    setLoading(false);
    setSaving(false);
    setError(null);
  }, []);

  return {
    richContent,
    loading,
    saving,
    error,
    loadRichContent,
    saveRichContent,
    reset,
  };
};
