import axios, { type AxiosResponse } from "axios";
import type {
  PlatformApiResponse,
  PlatformAuthSession,
  PlatformLoginBody,
  PlatformUser,
} from "@/views/platform/module/auth/types";

const URL_BACK = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const PLATFORM_TOKEN_KEY = "platform_access_token";

export const platformApi = axios.create({
  baseURL: URL_BACK,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(PLATFORM_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginPlatformRequest = (
  data: PlatformLoginBody,
): Promise<AxiosResponse<PlatformApiResponse<PlatformAuthSession>>> => {
  return platformApi.post("/platform/auth/login", data);
};

export const refreshPlatformRequest = (): Promise<
  AxiosResponse<PlatformApiResponse<PlatformAuthSession>>
> => {
  return platformApi.post("/platform/auth/refresh");
};

export const getPlatformMeRequest = (): Promise<
  AxiosResponse<PlatformApiResponse<Omit<PlatformUser, "context">>>
> => {
  return platformApi.get("/platform/auth/me");
};

export const logoutPlatformRequest = (): Promise<
  AxiosResponse<PlatformApiResponse<null>>
> => {
  return platformApi.post("/platform/auth/logout");
};

export { PLATFORM_TOKEN_KEY };
