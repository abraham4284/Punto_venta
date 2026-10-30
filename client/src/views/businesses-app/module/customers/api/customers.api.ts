import axios from "@/api/axios.config";
import type {
  CreateCustomerPayload,
  Customer,
  ToggleCustomerStatusPayload,
  UpdateCustomerPayload,
} from "../types/customers.types";

interface CustomerApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export const getCustomersRequest = (search?: string) => {
  return axios.get<CustomerApiResponse<Customer[]>>("/customers", {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });
};
export const getIdCustomersRequest = (id: number) => {
  return axios.get<CustomerApiResponse<Customer>>(`/customers/${id}`);
};

export const createCustomerRequest = (data: CreateCustomerPayload) => {
  return axios.post<CustomerApiResponse<Customer>>("/customers", data);
};

export const updateCustomerRequest = (data: UpdateCustomerPayload) => {
  const { idCustomer, ...payload } = data;
  return axios.put<CustomerApiResponse<Customer>>(`/customers/${idCustomer}`, payload);
};

export const toggleCustomerStatusRequest = (
  data: ToggleCustomerStatusPayload,
) => {
  return axios.patch<CustomerApiResponse<Customer>>(`/customers/${data.idCustomer}/status`, {
    isActive: data.isActive,
  });
};
