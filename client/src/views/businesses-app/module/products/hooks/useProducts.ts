import { useCallback, useMemo, useRef, useState } from "react";
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
  ProductsPagination,
  ProductsQueryParams,
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

const defaultPagination: ProductsPagination = {
  page: 1,
  currentPage: 1,
  limit: 20,
  total: 0,
  totalRecords: 0,
  totalPages: 1,
};

const normalizePagination = (
  value: Partial<ProductsPagination> | null | undefined,
  fallback: ProductsQueryParams,
): ProductsPagination => {
  const total = Number(value?.total ?? value?.totalRecords ?? 0);
  const limit = Number(value?.limit ?? fallback.limit ?? 20);
  const page = Number(value?.page ?? value?.currentPage ?? fallback.page ?? 1);

  return {
    page,
    currentPage: Number(value?.currentPage ?? page),
    limit,
    total,
    totalRecords: Number(value?.totalRecords ?? total),
    totalPages: Math.max(
      1,
      Number(value?.totalPages ?? (Math.ceil(total / limit) || 1)),
    ),
  };
};

export const useProducts = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<ProductCategoryOption[]>([]);
  const [pagination, setPagination] =
    useState<ProductsPagination>(defaultPagination);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [search, setSearch] = useState("");
  const lastQueryRef = useRef<ProductsQueryParams>({ page: 1, limit: 20 });
  const requestSequenceRef = useRef(0);

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

  const getProducts = useCallback(async (params: ProductsQueryParams = {}) => {
    const query: ProductsQueryParams = {
      page: 1,
      limit: 20,
      ...params,
    };
    const requestId = requestSequenceRef.current + 1;

    requestSequenceRef.current = requestId;
    lastQueryRef.current = query;

    try {
      setLoading(true);
      clearErrors();

      const response = await getProductsRequest(query);
      const responseData = response.data.data;

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      setProducts((responseData.items ?? []).map(normalizeProduct));
      setPagination(normalizePagination(responseData.pagination, query));
    } catch (error) {
      if (requestId !== requestSequenceRef.current) {
        return;
      }

      handleApiError(error);
      setProducts([]);
      setPagination(defaultPagination);
    } finally {
      if (requestId === requestSequenceRef.current) {
        setLoading(false);
      }
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
      await getProducts(lastQueryRef.current);
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
      await getProducts(lastQueryRef.current);

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

      await getProducts(lastQueryRef.current);
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
    setPagination(defaultPagination);
    lastQueryRef.current = { page: 1, limit: 20 };
  }, []);

  return {
    products,
    filteredProducts,
    categories,
    pagination,
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
