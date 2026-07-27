import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
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

const platformRefreshApi = axios.create({
  baseURL: URL_BACK,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryablePlatformRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const excludedRefreshEndpoints = [
  "/platform/auth/login",
  "/platform/auth/refresh",
  "/platform/auth/logout",
  "/platform/auth/base-user",
  "/platform/auth/bootstrap",
];

let platformRefreshPromise: Promise<string> | null = null;

const isExcludedRefreshRequest = (url?: string): boolean => {
  if (!url) return false;

  return excludedRefreshEndpoints.some((endpoint) => {
    return url.endsWith(endpoint) || url.includes(`${endpoint}?`);
  });
};

const refreshPlatformSession = (): Promise<string> => {
  if (!platformRefreshPromise) {
    platformRefreshPromise = platformRefreshApi
      .post<PlatformApiResponse<PlatformAuthSession>>("/platform/auth/refresh")
      .then((response) => {
        const token = response.data.data.accessToken;
        localStorage.setItem(PLATFORM_TOKEN_KEY, token);
        return token;
      })
      .finally(() => {
        platformRefreshPromise = null;
      });
  }

  return platformRefreshPromise;
};

const expirePlatformSession = (): void => {
  localStorage.removeItem(PLATFORM_TOKEN_KEY);

  if (window.location.pathname.startsWith("/platform")) {
    window.location.replace("/platform/login");
  }
};

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(PLATFORM_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

platformApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryablePlatformRequestConfig
      | undefined;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isExcludedRefreshRequest(originalRequest.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await refreshPlatformSession();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return platformApi(originalRequest);
    } catch (refreshError) {
      expirePlatformSession();
      return Promise.reject(refreshError);
    }
  },
);

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
