import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import {
  createProductCategoryRequest,
  getProductCategoriesRequest,
  updateProductCategoryRequest,
  updateProductCategoryStatusRequest,
} from "../api/productCategories.api";
import type {
  ApiErrorResponse,
  CreateProductCategoryBody,
  FieldError,
  ProductCategoryResponse,
  UpdateProductCategoryBody,
  UpdateProductCategoryStatusBody,
} from "../types/productCategories.types";

export const useProductCategories = () => {
  const [categories, setCategories] = useState<ProductCategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [search, setSearch] = useState("");

  const handleApiError = (error: unknown): FieldError[] => {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    const message =
      axiosError.response?.data?.message || "Ocurrió un error inesperado";

    const errors = axiosError.response?.data?.errors ?? [];

    setError(message);
    setFieldErrors(errors);

    return errors;
  };

  const clearErrors = () => {
    setError(null);
    setFieldErrors([]);
  };

  const getProductCategories = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();

      const response = await getProductCategoriesRequest();

      setCategories(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProductCategory = async (
    body: CreateProductCategoryBody,
  ): Promise<{
    status: boolean;
    message: string;
    errors?: FieldError[];
  }> => {
    try {
      clearErrors();

      const response = await createProductCategoryRequest(body);

      await getProductCategories();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo crear la categoría",
        errors,
      };
    }
  };

  const updateProductCategory = async (
    idProductCategory: number,
    body: UpdateProductCategoryBody,
  ): Promise<{
    status: boolean;
    message: string;
    errors?: FieldError[];
  }> => {
    try {
      clearErrors();

      const response = await updateProductCategoryRequest(
        idProductCategory,
        body,
      );

      await getProductCategories();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo actualizar la categoría",
        errors,
      };
    }
  };

  const toggleProductCategoryStatus = async (
    idProductCategory: number,
    body: UpdateProductCategoryStatusBody,
  ): Promise<{
    status: boolean;
    message: string;
    errors?: FieldError[];
  }> => {
    try {
      clearErrors();

      const response = await updateProductCategoryStatusRequest(
        idProductCategory,
        body,
      );
      console.log(response,'response')
      await getProductCategories();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo cambiar el estado de la categoría",
        errors,
      };
    }
  };

  const filteredCategories = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return categories;

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(value) ||
        category.description?.toLowerCase().includes(value)
      );
    });
  }, [categories, search]);

  const metrics = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((category) => category.isActive).length;
    const inactive = categories.filter((category) => !category.isActive).length;

    return {
      total,
      active,
      inactive,
    };
  }, [categories]);


  const resetCategories = () =>{
    setLoading(false);
    setError(null);
    setCategories([]);
  }

  return {
    categories,
    filteredCategories,
    metrics,
    loading,
    error,
    fieldErrors,
    search,
    setSearch,
    clearErrors,
    getProductCategories,
    createProductCategory,
    updateProductCategory,
    toggleProductCategoryStatus,
    resetCategories,
  };
};