import { useCallback, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import {
  getAdvancedStockInventoryRequest,
  getCriticalStockReportRequest,
  getStockByProductAndDepositRequest,
} from "../api/stock.api";
import type {
  AdvancedStockFilters,
  AdvancedStockInventoryItem,
  AdvancedStockPagination,
  ApiErrorResponse,
  CriticalStockReportResponse,
  CriticalStockAlertStatus,
  FieldError,
  StockBalanceResponse,
  StockResponse,
} from "../types/stock.types";

const STOCK_PAGE_LIMIT = 15;

const initialStockFilters: AdvancedStockFilters = {
  search: "",
  idDeposit: null,
  quantity: null,
  minQuantity: null,
  maxQuantity: null,
  alertStatus: null,
  page: 1,
  limit: STOCK_PAGE_LIMIT,
};

const initialPagination: AdvancedStockPagination = {
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  limit: STOCK_PAGE_LIMIT,
};

const hasActiveStockFilters = (filters: AdvancedStockFilters): boolean => {
  return Boolean(
    filters.search.trim() ||
      filters.idDeposit ||
      filters.quantity !== null ||
      filters.minQuantity !== null ||
      filters.maxQuantity !== null ||
      filters.alertStatus,
  );
};

const mapAdvancedStockToStockResponse = (
  item: AdvancedStockInventoryItem,
): StockResponse => {
  return {
    idStock: item.idStock,
    idBusiness: 0,
    businessName: "",
    idProduct: item.idProduct,
    productName: item.productName,
    barcode: item.barcode,
    productImageUrl: item.imageUrl,
    unitType: item.unitType ?? "UNIT",
    isActive: item.isActive,
    categoryName: item.categoryName ?? item.barcode ?? "Sin categoria",
    priceCost: item.priceCost,
    priceSale: item.priceSale,
    idDeposit: item.idDeposit,
    depositName: item.depositName,
    quantity: item.quantity,
    updatedAt: null,
    stock_min: item.stockMin,
  };
};

export const useStock = () => {
  const [stock, setStock] = useState<StockResponse[]>([]);
  const [stockData, setStockData] = useState<StockResponse[]>([]);
  const [pagination, setPagination] =
    useState<AdvancedStockPagination>(initialPagination);
  const [activeFilters, setActiveFilters] =
    useState<AdvancedStockFilters>(initialStockFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [criticalStockData, setCriticalStockData] = useState<
    CriticalStockReportResponse[]
  >([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [maxQuantityFilter, setMaxQuantityFilter] = useState<number | null>(null);
  const [depositFilter, setDepositFilter] = useState<number | null>(null);
  const [criticalStatusFilter, setCriticalStatusFilter] =
    useState<CriticalStockAlertStatus | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [loadingStockBalance, setLoadingStockBalance] = useState(false);

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

  const fetchStockInventory = useCallback(
    async (
      filters: AdvancedStockFilters,
      notifyWhenEmpty: boolean,
    ): Promise<void> => {
      try {
        setLoading(true);
        clearErrors();

        const response = await getAdvancedStockInventoryRequest(filters);
        const result = response.data.data;
        const mappedStock = result.stock.map(mapAdvancedStockToStockResponse);

        setStock(mappedStock);
        setStockData(mappedStock);
        setPagination(result.pagination);

        if (
          notifyWhenEmpty &&
          hasActiveStockFilters(filters) &&
          result.stock.length === 0
        ) {
          toast.error(
            "No se encontraron productos en el inventario con los filtros seleccionados",
          );
        }
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    },
    [clearErrors, handleApiError],
  );

  const getStock = useCallback(async () => {
    setActiveFilters(initialStockFilters);
    await fetchStockInventory(initialStockFilters, false);
  }, [fetchStockInventory]);

  const refreshStock = useCallback(async () => {
    await fetchStockInventory(activeFilters, false);
  }, [activeFilters, fetchStockInventory]);

  const applyStockFilters = useCallback(
    async (filters: Omit<AdvancedStockFilters, "page" | "limit">) => {
      const nextFilters: AdvancedStockFilters = {
        ...filters,
        page: 1,
        limit: STOCK_PAGE_LIMIT,
      };

      setActiveFilters(nextFilters);
      await fetchStockInventory(nextFilters, true);
    },
    [fetchStockInventory],
  );

  const changeStockPage = useCallback(
    async (page: number) => {
      const safePage = Math.min(Math.max(page, 1), pagination.totalPages);
      const nextFilters: AdvancedStockFilters = {
        ...activeFilters,
        page: safePage,
        limit: STOCK_PAGE_LIMIT,
      };

      setActiveFilters(nextFilters);
      await fetchStockInventory(nextFilters, false);
    },
    [activeFilters, fetchStockInventory, pagination.totalPages],
  );

  const getCriticalStockReport = useCallback(async () => {
    try {
      setLoadingReport(true);
      clearErrors();

      const response = await getCriticalStockReportRequest({
        maxQuantity: maxQuantityFilter,
        idDeposit: depositFilter,
        search: productSearch,
        alertStatus: criticalStatusFilter,
      });

      setCriticalStockData(response.data.data ?? []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingReport(false);
    }
  }, [
    clearErrors,
    criticalStatusFilter,
    depositFilter,
    handleApiError,
    maxQuantityFilter,
    productSearch,
  ]);

  const fetchCurrentStockBalance = useCallback(
    async (
      idProduct: number,
      idDeposit: number,
    ): Promise<StockBalanceResponse | null> => {
      try {
        setLoadingStockBalance(true);
        clearErrors();

        const response = await getStockByProductAndDepositRequest(
          idProduct,
          idDeposit,
        );

        return response.data.data;
      } catch (error) {
        handleApiError(error);
        return null;
      } finally {
        setLoadingStockBalance(false);
      }
    },
    [clearErrors, handleApiError],
  );

  const metrics = useMemo(() => {
    const total = stockData.length;
    const totalUnits = stockData.reduce((acc, item) => {
      return acc + Number(item.quantity);
    }, 0);
    const zeroStock = stockData.filter((item) => item.quantity === 0).length;
    const lowStock = stockData.filter((item) => {
      return item.quantity > 0 && item.quantity <= item.stock_min;
    }).length;
    const uniqueProducts = new Set(
      stockData.map((item) => {
        return item.idProduct;
      }),
    ).size;
    const activeDeposits = new Set(
      stockData.map((item) => {
        return item.idDeposit;
      }),
    ).size;

    return {
      total,
      totalUnits,
      zeroStock,
      lowStock,
      uniqueProducts,
      activeDeposits,
    };
  }, [stockData]);

  const criticalMetrics = useMemo(() => {
    const zeroStock = criticalStockData.filter((item) => {
      return item.alertStatus === "CRITICAL_ZERO";
    }).length;

    const lowStock = criticalStockData.filter((item) => {
      return item.alertStatus === "CRITICAL_LOW";
    }).length;

    const equalStock = criticalStockData.filter((item) => {
      return item.alertStatus === "CRITICAL_EQUAL";
    }).length;

    return {
      totalRestockItems: zeroStock + lowStock + equalStock,
      zeroStock,
      lowStock,
      equalStock,
    };
  }, [criticalStockData]);

  const resetStock = useCallback(() => {
    setLoading(false);
    setError(null);
    setStock([]);
    setStockData([]);
    setPagination(initialPagination);
    setActiveFilters(initialStockFilters);
    setCriticalStockData([]);
    setMaxQuantityFilter(null);
    setDepositFilter(null);
    setCriticalStatusFilter(null);
    setProductSearch("");
  }, []);

  return {
    stock,
    stockData,
    pagination,
    activeFilters,
    metrics,
    loading,
    error,
    fieldErrors,
    criticalStockData,
    criticalMetrics,
    loadingReport,
    loadingStockBalance,
    maxQuantityFilter,
    depositFilter,
    criticalStatusFilter,
    productSearch,
    setMaxQuantityFilter,
    setDepositFilter,
    setCriticalStatusFilter,
    setProductSearch,
    clearErrors,
    getStock,
    refreshStock,
    applyStockFilters,
    changeStockPage,
    getCriticalStockReport,
    fetchCurrentStockBalance,
    resetStock,
  };
};
