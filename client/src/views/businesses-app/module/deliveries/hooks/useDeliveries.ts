import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import {
  assignDeliveryRequest,
  cancelDeliveryRequest,
  deliverDeliveryRequest,
  failDeliveryRequest,
  getDeliveriesRequest,
  getDeliveryByIdRequest,
  getDeliveryUsersRequest,
  rescheduleDeliveryRequest,
  startDeliveryRequest,
} from "../api/deliveries.api";
import type {
  DeliveryActionBody,
  DeliveryFilters,
  DeliveryPagination,
  DeliveryResponse,
  DeliveryUserOption,
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

type UseDeliveriesOptions = {
  autoFetch?: boolean;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

export const useDeliveries = ({ autoFetch = true }: UseDeliveriesOptions = {}) => {
  const [deliveries, setDeliveries] = useState<DeliveryResponse[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryResponse | null>(null);
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUserOption[]>([]);
  const [filters, setFilters] = useState<DeliveryFilters>(defaultFilters);
  const [pagination, setPagination] =
    useState<DeliveryPagination>(defaultPagination);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getDeliveriesRequest(
        pagination.currentPage,
        pagination.limit,
        filters,
      );
      setDeliveries(data.data.deliveries);
      setPagination(data.data.pagination);
    } catch (error) {
      const message = getErrorMessage(error, "No se pudieron cargar las entregas");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  const fetchDeliveryById = useCallback(async (idSaleDelivery: number) => {
    setDetailLoading(true);
    setError(null);

    try {
      const { data } = await getDeliveryByIdRequest(idSaleDelivery);
      setSelectedDelivery(data.data);
      return data.data;
    } catch (error) {
      const message = getErrorMessage(error, "No se pudo cargar la entrega");
      setError(message);
      toast.error(message);
      setSelectedDelivery(null);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchDeliveryUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const { data } = await getDeliveryUsersRequest();
      setDeliveryUsers(data.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar los cadetes"));
      setDeliveryUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

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
    setSelectedDelivery((current) => {
      if (!current || current.idSaleDelivery !== delivery.idSaleDelivery) {
        return current;
      }

      return delivery;
    });
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

  const assignDelivery = (
    idSaleDelivery: number,
    assignedToUserId: number,
  ) => {
    return runAction(idSaleDelivery, () =>
      assignDeliveryRequest(idSaleDelivery, { assignedToUserId }),
    );
  };

  const startDelivery = (idSaleDelivery: number) => {
    return runAction(idSaleDelivery, () => startDeliveryRequest(idSaleDelivery));
  };

  const deliverDelivery = (idSaleDelivery: number) => {
    return runAction(idSaleDelivery, () => deliverDeliveryRequest(idSaleDelivery));
  };

  const failDelivery = (
    idSaleDelivery: number,
    body: Pick<DeliveryActionBody, "failureReason" | "observation">,
  ) => {
    return runAction(idSaleDelivery, () =>
      failDeliveryRequest(idSaleDelivery, body),
    );
  };

  const rescheduleDelivery = (
    idSaleDelivery: number,
    body: Pick<DeliveryActionBody, "scheduledAt" | "observation">,
  ) => {
    return runAction(idSaleDelivery, () =>
      rescheduleDeliveryRequest(idSaleDelivery, body),
    );
  };

  const cancelDelivery = (
    idSaleDelivery: number,
    body: Pick<DeliveryActionBody, "observation"> = {},
  ) => {
    return runAction(idSaleDelivery, () => cancelDeliveryRequest(idSaleDelivery, body));
  };

  const resetSelectedDelivery = useCallback(() => {
    setSelectedDelivery(null);
    setDetailLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!autoFetch) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchDeliveries();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [autoFetch, fetchDeliveries]);

  return {
    deliveries,
    selectedDelivery,
    deliveryUsers,
    filters,
    pagination,
    loading,
    detailLoading,
    usersLoading,
    actionLoadingId,
    error,
    applyFilters,
    changePage,
    fetchDeliveries,
    fetchDeliveryById,
    fetchDeliveryUsers,
    resetSelectedDelivery,
    assignDelivery,
    startDelivery,
    deliverDelivery,
    failDelivery,
    rescheduleDelivery,
    cancelDelivery,
  };
};
