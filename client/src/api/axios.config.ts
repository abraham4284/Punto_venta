import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const URL_BACK = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const axiosInstance = axios.create({
  baseURL: URL_BACK,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: URL_BACK,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const excludedRefreshEndpoints = [
  "/login",
  "/register",
  "/refresh",
  "/logout",
];

let refreshPromise: Promise<void> | null = null;

const isExcludedRefreshRequest = (url?: string): boolean => {
  if (!url) return false;

  return excludedRefreshEndpoints.some((endpoint) => {
    return url.endsWith(endpoint) || url.includes(`${endpoint}?`);
  });
};

const refreshSession = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const expireFrontendSession = async (): Promise<void> => {
  const { useAuthStore } = await import(
    "@/views/admin/module/auth/store/auth.store"
  );

  useAuthStore
    .getState()
    .expireSession("La sesion expiro. Inicia sesion nuevamente.");
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
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
      await refreshSession();
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      await expireFrontendSession();
      return Promise.reject(refreshError);
    }
  },
);

export default axiosInstance;
