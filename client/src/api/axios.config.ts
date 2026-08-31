import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const URL_BACK = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const CSRF_HEADER_NAME = "X-CSRF-Protection";
const CSRF_HEADER_VALUE = "1";
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

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
    [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
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
let subscriptionRefreshPromise: Promise<void> | null = null;

interface SubscriptionLimitResponseData {
  code?: string;
  message?: string;
  data?: {
    resource?: "USERS" | "PRODUCTS" | "DEPOSITS";
    planName?: string | null;
    currentUsage?: number;
    maximumAllowed?: number | null;
    remaining?: number | null;
  };
}

const isExcludedRefreshRequest = (url?: string): boolean => {
  if (!url) return false;

  return excludedRefreshEndpoints.some((endpoint) => {
    return url.endsWith(endpoint) || url.includes(`${endpoint}?`);
  });
};

const notifyRequestLimitError = async (statusCode: number): Promise<void> => {
  const { default: toast } = await import("react-hot-toast");

  if (statusCode === 429) {
    toast.error("Demasiadas solicitudes. Espera unos momentos e intenta nuevamente.");
    return;
  }

  if (statusCode === 413) {
    toast.error("El contenido o archivo enviado supera el tamano permitido.");
  }
};

const refreshSession = (): Promise<void> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const nextRefreshPromise = refreshClient
    .post("/refresh")
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });

  refreshPromise = nextRefreshPromise;
  return nextRefreshPromise;
};

const expireFrontendSession = async (): Promise<void> => {
  const { useAuthStore } = await import(
    "@/views/businesses-app/module/auth/store/auth.store"
  );

  useAuthStore
    .getState()
    .expireSession("La sesion expiro. Inicia sesion nuevamente.");
};

const refreshBusinessSubscription = async (): Promise<void> => {
  if (!subscriptionRefreshPromise) {
    subscriptionRefreshPromise = import(
      "@/views/businesses-app/module/subscription/store/businessSubscription.store"
    )
      .then(({ useBusinessSubscriptionStore }) =>
        useBusinessSubscriptionStore.getState().refreshSubscription(),
      )
      .finally(() => {
        subscriptionRefreshPromise = null;
      });
  }

  return subscriptionRefreshPromise;
};

const notifySubscriptionLimitReached = async (
  responseData: SubscriptionLimitResponseData,
): Promise<void> => {
  const { default: toast } = await import("react-hot-toast");
  const resourceLabels: Record<"USERS" | "PRODUCTS" | "DEPOSITS", string> = {
    USERS: "usuarios",
    PRODUCTS: "productos",
    DEPOSITS: "depositos",
  };
  const resource = responseData.data?.resource;
  const resourceLabel = resource ? resourceLabels[resource] : "recursos";
  const planName = responseData.data?.planName;
  const currentUsage = responseData.data?.currentUsage;
  const maximumAllowed = responseData.data?.maximumAllowed;
  const usageText =
    typeof currentUsage === "number" && typeof maximumAllowed === "number"
      ? ` Uso actual: ${currentUsage} de ${maximumAllowed}.`
      : "";

  toast.error(
    `${responseData.message || `Alcanzaste el limite de ${resourceLabel} de tu plan.`}${
      planName ? ` Plan: ${planName}.` : ""
    }${usageText} Para crear mas ${resourceLabel}, necesitas cambiar de plan.`,
    { duration: 7000 },
  );
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 429 || error.response?.status === 413) {
      await notifyRequestLimitError(error.response.status);
      return Promise.reject(error);
    }

    if (
      error.response?.status === 402 &&
      (error.response.data as { code?: string } | undefined)?.code ===
        "SUBSCRIPTION_REQUIRED" &&
      originalRequest?.url !== "/business/subscription"
    ) {
      await refreshBusinessSubscription();
      return Promise.reject(error);
    }

    if (
      error.response?.status === 409 &&
      (error.response.data as SubscriptionLimitResponseData | undefined)?.code ===
        "SUBSCRIPTION_RESOURCE_LIMIT_REACHED"
    ) {
      const responseData = error.response.data as SubscriptionLimitResponseData;
      await refreshBusinessSubscription();
      await notifySubscriptionLimitReached(responseData);
      return Promise.reject(error);
    }

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

axiosInstance.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  if (method && MUTATING_METHODS.has(method)) {
    config.headers[CSRF_HEADER_NAME] = CSRF_HEADER_VALUE;
  }

  return config;
});

export default axiosInstance;
