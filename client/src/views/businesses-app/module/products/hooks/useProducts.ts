import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import {
  createProductRequest,
  getProductCategoriesOptionsRequest,
  getProductsRequest,
  updateProductPrices,
  updateProductRequest,
  updateProductStatusRequest,
} from "../api/products.api";
import type {
  ApiErrorResponse,
  CreateProductPayload,
  FieldError,
  ProductCategoryOption,
  ProductResponse,
  ProductUnitType,
  UpdateProductPricesPayload,
  UpdateProductPayload,
  UpdateProductStatusPayload,
} from "../types/products.types";
import { useBusinessSubscriptionStore } from "../../subscription/store/businessSubscription.store";

const normalizeUnitType = (
  unitType: ProductResponse["unitType"] | null | undefined,
): ProductUnitType => {
  return unitType ?? "UNIT";
};

const normalizeProduct = (product: ProductResponse): ProductResponse => {
  return {
    ...product,
    unitType: normalizeUnitType(product.unitType),
  };
};

export const useProducts = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<ProductCategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
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

  const getProducts = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();

      const response = await getProductsRequest();

      setProducts((response.data.data ?? []).map(normalizeProduct));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);

      const response = await getProductCategoriesOptionsRequest();

      setCategories(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const createProduct = async (
    payload: CreateProductPayload,
  ): Promise<{ status: boolean; message: string; errors?: FieldError[] }> => {
    try {
      clearErrors();
      const response = await createProductRequest(payload);
      await getProducts();
      await useBusinessSubscriptionStore.getState().refreshSubscription();
      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo crear el producto",
        errors,
      };
    }
  };

  const updateProduct = async (
    idProduct: number,
    payload: UpdateProductPayload,
  ): Promise<{ status: boolean; message: string; errors?: FieldError[] }> => {
    try {
      clearErrors();
      const response = await updateProductRequest(idProduct, payload);
      await getProducts();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo actualizar el producto",
        errors,
      };
    }
  };

  const toggleProductStatus = async (
    idProduct: number,
    payload: UpdateProductStatusPayload,
  ): Promise<{ status: boolean; message: string; errors?: FieldError[] }> => {
    try {
      clearErrors();

      const response = await updateProductStatusRequest(idProduct, payload);

      await getProducts();
      await useBusinessSubscriptionStore.getState().refreshSubscription();

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudo cambiar el estado del producto",
        errors,
      };
    }
  };

  const updateProductPricesAction = async (
    idProduct: number,
    payload: UpdateProductPricesPayload,
  ): Promise<{ status: boolean; message: string; errors?: FieldError[] }> => {
    try {
      clearErrors();

      const response = await updateProductPrices(idProduct, payload);
      const updatedProduct = normalizeProduct(response.data.data);

      setProducts((currentProducts) =>
        currentProducts.map((product) => {
          if (product.idProduct !== idProduct) return product;

          return updatedProduct;
        }),
      );

      return {
        status: true,
        message: response.data.message,
      };
    } catch (error) {
      const errors = handleApiError(error);

      return {
        status: false,
        message: "No se pudieron actualizar los precios",
        errors,
      };
    }
  };

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(value) ||
        product.barcode?.toLowerCase().includes(value)
      );
    });
  }, [products, search]);

  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((product) => product.isActive).length;
    const inactive = products.filter((product) => !product.isActive).length;

    const minStockReached = products.filter((product) => {
      return product.stock <= product.stockMin;
    }).length;

    return {
      total,
      minStockReached,
      active,
      inactive,
    };
  }, [products]);

  const resetProducts = useCallback(() => {
    setLoading(false);
    setError(null);
    setProducts([]);
  }, []);

  return {
    products,
    filteredProducts,
    categories,
    metrics,
    loading,
    loadingCategories,
    error,
    fieldErrors,
    search,
    setSearch,
    clearErrors,
    getProducts,
    getProductCategories,
    createProduct,
    updateProduct,
    updateProductPricesAction,
    toggleProductStatus,
    resetProducts,
  };
};
