import axios from "@/api/axios.config";
import type { ApiResponse } from "@/api/axios.response.type";
import type { AxiosResponse } from "axios";
import type {
  BusinessUser,
  BusinessUserPermissionsResponse,
  BusinessUsersFilters,
  BusinessUsersResponse,
  CreateBusinessUserBody,
  PermissionGroup,
  UpdateBusinessUserBody,
} from "../types";

const appendParam = (
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
): void => {
  if (value === null || value === undefined || value === "") return;
  params.append(key, String(value));
};

export const getBusinessUsers = async (
  filters: BusinessUsersFilters,
): Promise<AxiosResponse<ApiResponse<BusinessUsersResponse>>> => {
  const params = new URLSearchParams();
  appendParam(params, "search", filters.search);
  appendParam(params, "role", filters.role);
  appendParam(params, "status", filters.status);
  appendParam(params, "page", filters.page);
  appendParam(params, "limit", filters.limit);

  return axios.get(`/business-users?${params.toString()}`);
};

export const createBusinessUser = async (
  body: CreateBusinessUserBody,
): Promise<AxiosResponse<ApiResponse<BusinessUser>>> => {
  return axios.post("/business-users", body);
};

export const updateBusinessUser = async (
  idUser: number,
  body: UpdateBusinessUserBody,
): Promise<AxiosResponse<ApiResponse<BusinessUser>>> => {
  return axios.patch(`/business-users/${idUser}`, body);
};

export const changeBusinessUserRole = async (
  idUser: number,
  role: "ADMIN" | "SELLER",
): Promise<AxiosResponse<ApiResponse<BusinessUser>>> => {
  return axios.patch(`/business-users/${idUser}/role`, { role });
};

export const changeBusinessUserStatus = async (
  idUser: number,
  isActive: boolean,
): Promise<AxiosResponse<ApiResponse<BusinessUser>>> => {
  return axios.patch(`/business-users/${idUser}/status`, { isActive });
};

export const getPermissionGroups = async (): Promise<
  AxiosResponse<ApiResponse<PermissionGroup[]>>
> => {
  return axios.get("/permissions/grouped");
};

export const getBusinessUserPermissions = async (
  idUser: number,
): Promise<AxiosResponse<ApiResponse<BusinessUserPermissionsResponse>>> => {
  return axios.get(`/business-users/${idUser}/permissions`);
};

export const updateBusinessUserPermissions = async (
  idUser: number,
  permissions: BusinessUserPermissionsResponse["overrides"],
): Promise<AxiosResponse<ApiResponse<BusinessUserPermissionsResponse>>> => {
  return axios.put(`/business-users/${idUser}/permissions`, { permissions });
};

export const resetBusinessUserPermissions = async (
  idUser: number,
): Promise<AxiosResponse<ApiResponse<BusinessUserPermissionsResponse>>> => {
  return axios.delete(`/business-users/${idUser}/permissions`);
};

