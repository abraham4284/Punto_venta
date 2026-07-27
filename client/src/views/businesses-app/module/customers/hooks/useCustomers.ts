import { useCallback, useMemo, useState } from "react";
import {
  createCustomerRequest,
  getCustomersRequest,
  getIdCustomersRequest,
  toggleCustomerStatusRequest,
  updateCustomerRequest,
} from "../api/customers.api";
import type {
  CreateCustomerPayload,
  Customer,
  ToggleCustomerStatusPayload,
  UpdateCustomerPayload,
} from "../types/customers.types";

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersById, setCustomersById] = useState<Customer[]>([]);
  const [customerById, setCustomerById] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingById, setLoadingById] = useState(false);

  const getCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getCustomersRequest();
      setCustomers(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const getIdCustomers = useCallback(async (id: number) => {
    try {
      setLoadingById(true);
      const { data } = await getIdCustomersRequest(id);
      const customerData = data.data ?? null;
      const normalizedCustomer = Array.isArray(customerData)
        ? (customerData[0] ?? null)
        : customerData;

      setCustomerById(normalizedCustomer);
      setCustomersById(normalizedCustomer ? [normalizedCustomer] : []);
    } finally {
      setLoadingById(false);
    }
  }, []);

  const createCustomer = async (payload: CreateCustomerPayload) => {
    const { data } = await createCustomerRequest(payload);
    await getCustomers();
    return data;
  };

  const updateCustomer = async (payload: UpdateCustomerPayload) => {
    const { data } = await updateCustomerRequest(payload);
    await getCustomers();
    return data;
  };

  const toggleCustomerStatus = async (payload: ToggleCustomerStatusPayload) => {
    const { data } = await toggleCustomerStatusRequest(payload);
    await getCustomers();
    return data;
  };

  const metrics = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((customer) => customer.isActive).length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
    };
  }, [customers]);

  const resetCustomers = useCallback(() => {
    setLoading(false);
    setCustomers([]);
  }, []);

  const resetIdCustomers = useCallback(() => {
    setLoadingById(false);
    setCustomerById(null);
    setCustomersById([]);
  }, []);

  return {
    customers,
    customersById,
    customerById,
    loadingById,
    loading,
    metrics,
    getCustomers,
    createCustomer,
    updateCustomer,
    toggleCustomerStatus,
    getIdCustomers,
    resetCustomers,
    resetIdCustomers,
  };
};
