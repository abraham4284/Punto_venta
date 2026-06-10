import { useCallback, useMemo, useState } from "react";
import {
  createCustomerRequest,
  getCustomersRequest,
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
  const [loading, setLoading] = useState(false);

  const getCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getCustomersRequest();
      setCustomers(data.data ?? []);
    } finally {
      setLoading(false);
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

  const resetCustomers = () => {
    setLoading(false);
    setCustomers([]);
  };

  return {
    customers,
    loading,
    metrics,
    getCustomers,
    createCustomer,
    updateCustomer,
    toggleCustomerStatus,
    resetCustomers
  };
};
