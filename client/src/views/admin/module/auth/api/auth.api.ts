import axios from "@/api/axios.config";
import type { AxiosResponse } from "axios";
import type { ApiMessageResponse,ApiResponse } from "@/api/axios.response.type";
import type { LoginBody, RegisterBody,AuthUser } from "@/views/admin/module/auth/types/auth.types";

export const loginRequest = async (data: LoginBody): Promise<AxiosResponse<ApiMessageResponse>> => axios.post("/login",data);
export const registerRequest = async (data: RegisterBody): Promise<AxiosResponse<ApiMessageResponse>> => axios.post("/register",data);
export const logoutRequest = async (): Promise<AxiosResponse<ApiMessageResponse>> => axios.post("/logout");
export const refreshRequest = async (): Promise<AxiosResponse<ApiMessageResponse>> => axios.post("/refresh");
export const meRequest = async (): Promise<AxiosResponse<ApiResponse<AuthUser>>> => axios.get("/me")



