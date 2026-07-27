import { create } from "zustand";
import type { AxiosError } from "axios";
import {
  getPlatformMeRequest,
  loginPlatformRequest,
  logoutPlatformRequest,
  PLATFORM_TOKEN_KEY,
  refreshPlatformRequest,
} from "@/views/platform/module/auth/api/platformAuth.api";
import type {
  PlatformAuthSession,
  PlatformLoginBody,
  PlatformUser,
  PlatformValidationResponse,
} from "@/views/platform/module/auth/types";

type PlatformAuthActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

interface PlatformAuthState {
  platformUser: PlatformUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isChecking: boolean;
  error: string | null;
  loginPlatformAction: (
    credentials: PlatformLoginBody,
  ) => Promise<PlatformAuthActionResult>;
  logoutPlatformAction: () => Promise<void>;
  checkPlatformSession: () => Promise<void>;
}

const mapPlatformUser = (
  user: PlatformAuthSession["user"],
): PlatformUser => {
  return {
    ...user,
    context: "PLATFORM",
  };
};

const getPlatformErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const axiosError = error as AxiosError<PlatformValidationResponse>;

  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  platformUser: null,
  token: localStorage.getItem(PLATFORM_TOKEN_KEY),
  isAuthenticated: false,
  isLoading: false,
  isChecking: false,
  error: null,

  loginPlatformAction: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await loginPlatformRequest(credentials);
      const token = data.data.accessToken;
      const platformUser = mapPlatformUser(data.data.user);

      localStorage.setItem(PLATFORM_TOKEN_KEY, token);
      set({
        platformUser,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: data.message || "Acceso de plataforma correcto",
      };
    } catch (error: unknown) {
      const message = getPlatformErrorMessage(
        error,
        "No se pudo iniciar sesion en plataforma",
      );

      localStorage.removeItem(PLATFORM_TOKEN_KEY);
      set({
        platformUser: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });

      return { success: false, message };
    }
  },

  logoutPlatformAction: async () => {
    try {
      await logoutPlatformRequest();
    } finally {
      localStorage.removeItem(PLATFORM_TOKEN_KEY);
      set({
        platformUser: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isChecking: false,
        error: null,
      });
    }
  },

  checkPlatformSession: async () => {
    set({ isChecking: true, error: null });

    try {
      const { data } = await getPlatformMeRequest();
      set({
        platformUser: mapPlatformUser(data.data),
        token: localStorage.getItem(PLATFORM_TOKEN_KEY),
        isAuthenticated: true,
        isChecking: false,
        error: null,
      });
    } catch {
      try {
        const { data } = await refreshPlatformRequest();
        const token = data.data.accessToken;

        localStorage.setItem(PLATFORM_TOKEN_KEY, token);
        set({
          platformUser: mapPlatformUser(data.data.user),
          token,
          isAuthenticated: true,
          isChecking: false,
          error: null,
        });
      } catch (error: unknown) {
        const message = getPlatformErrorMessage(
          error,
          "Sesion de plataforma no valida",
        );

        localStorage.removeItem(PLATFORM_TOKEN_KEY);
        set({
          platformUser: null,
          token: null,
          isAuthenticated: false,
          isChecking: false,
          error: message,
        });
      }
    }
  },
}));
