import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type { ApiMessageResponse, ApiResponse } from "@/api/axios.response.type";
import type {
  AuthUser,
  AuthSessionResponse,
  LoginBody,
  RegisterBody,
  UpdatePasswordBody,
  UpdatePasswordResponse,
  UserInfoResponse,
} from "@/views/businesses-app/module/auth/types/auth.types";

export const loginRequest = async (
  data: LoginBody,
): Promise<AxiosResponse<ApiResponse<AuthSessionResponse>>> =>
  axios.post("/login", data);

export const registerRequest = async (
  data: RegisterBody,
): Promise<AxiosResponse<ApiResponse<AuthSessionResponse>>> =>
  axios.post("/register", data);

export const logoutRequest = async (): Promise<
  AxiosResponse<ApiMessageResponse>
> => axios.post("/logout");

export const refreshRequest = async (): Promise<
  AxiosResponse<ApiMessageResponse>
> => axios.post("/refresh");

export const meRequest = async (): Promise<AxiosResponse<ApiResponse<AuthUser>>> =>
  axios.get("/me");

export const getUserInfoById = async (
  idUser: number,
): Promise<AxiosResponse<ApiResponse<UserInfoResponse>>> => {
  return axios.get(`/auth/user-info/${idUser}`);
};

export const updatePassword = async (
  idUser: number,
  data: UpdatePasswordBody,
): Promise<AxiosResponse<ApiResponse<UpdatePasswordResponse>>> => {
  return axios.patch(`/auth/update-password/${idUser}`, data);
};

