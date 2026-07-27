import axios from "@/api/axios.config";
import type {
  CreateCustomerPayload,
  ToggleCustomerStatusPayload,
  UpdateCustomerPayload,
} from "../types/customers.types";

export const getCustomersRequest = () => {
  return axios.get("/customers");
};
export const getIdCustomersRequest = (id: number) => {
  return axios.get(`/customers/${id}`);
};

export const createCustomerRequest = (data: CreateCustomerPayload) => {
  return axios.post("/customers", data);
};

export const updateCustomerRequest = (data: UpdateCustomerPayload) => {
  const { idCustomer, ...payload } = data;
  return axios.put(`/customers/${idCustomer}`, payload);
};

export const toggleCustomerStatusRequest = (
  data: ToggleCustomerStatusPayload,
) => {
  return axios.patch(`/customers/${data.idCustomer}/status`, {
    isActive: data.isActive,
  });
};