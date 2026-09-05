import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import {
  cancelDeliveryRequest,
  deliverDeliveryRequest,
  failDeliveryRequest,
  getDeliveriesRequest,
  startDeliveryRequest,
} from "../api/deliveries.api";
import type {
  DeliveryFilters,
  DeliveryPagination,
  DeliveryResponse,
} from "../types";

type ApiError = {
  message?: string;
};

const defaultFilters: DeliveryFilters = {
  search: "",
  status: "",
  assignedToUserId: null,
};

const defaultPagination: DeliveryPagination = {
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 15,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState<DeliveryResponse[]>([]);
  const [filters, setFilters] = useState<DeliveryFilters>(defaultFilters);
  const [pagination, setPagination] =
    useState<DeliveryPagination>(defaultPagination);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getDeliveriesRequest(
        pagination.currentPage,
        pagination.limit,
        filters,
      );
      setDeliveries(data.data.deliveries);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar las entregas"));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  const changePage = (page: number) => {
    setPagination((current) => ({
      ...current,
      currentPage: Math.min(Math.max(page, 1), current.totalPages),
    }));
  };

  const applyFilters = (nextFilters: DeliveryFilters) => {
    setFilters(nextFilters);
    setPagination((current) => ({
      ...current,
      currentPage: 1,
    }));
  };

  const replaceDelivery = (delivery: DeliveryResponse) => {
    setDeliveries((current) =>
      current.map((item) =>
        item.idSaleDelivery === delivery.idSaleDelivery ? delivery : item,
      ),
    );
  };

  const runAction = async (
    idSaleDelivery: number,
    action: () => Promise<{ data: { data: DeliveryResponse; message: string } }>,
  ) => {
    setActionLoadingId(idSaleDelivery);

    try {
      const response = await action();
      replaceDelivery(response.data.data);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar la entrega"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const startDelivery = (idSaleDelivery: number) => {
    return runAction(idSaleDelivery, () => startDeliveryRequest(idSaleDelivery));
  };

  const deliverDelivery = (idSaleDelivery: number) => {
    return runAction(idSaleDelivery, () => deliverDeliveryRequest(idSaleDelivery));
  };

  const failDelivery = (idSaleDelivery: number, failureReason: string) => {
    return runAction(idSaleDelivery, () =>
      failDeliveryRequest(idSaleDelivery, { failureReason }),
    );
  };

  const cancelDelivery = (idSaleDelivery: number) => {
    return runAction(idSaleDelivery, () => cancelDeliveryRequest(idSaleDelivery));
  };

  useEffect(() => {
    void fetchDeliveries();
  }, [fetchDeliveries]);

  return {
    deliveries,
    filters,
    pagination,
    loading,
    actionLoadingId,
    applyFilters,
    changePage,
    startDelivery,
    deliverDelivery,
    failDelivery,
    cancelDelivery,
  };
};
