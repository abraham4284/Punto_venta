import { create } from "zustand";
import type { AxiosError } from "axios";
import type { ApiMessageResponse } from "@/api/axios.response.type";
import {
  getUserInfoById,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  updatePassword,
} from "@/views/businesses-app/module/auth/api/auth.api";
import type {
  AuthValidationResponse,
  BusinessSessionUser,
  FieldError,
  RegisterBody,
  UserInfoResponse,
} from "@/views/businesses-app/module/auth/types/auth.types";
import { usePurchaseCartStore } from "@/views/businesses-app/module/purchases/store/purchaseCart.store";
import { useBusinessSubscriptionStore } from "@/views/businesses-app/module/subscription/store/businessSubscription.store";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";
type AuthActionResult =
  | { success: true; message: string }
  | { success: false; message: string | undefined };

const INVALID_LOGIN_MESSAGE = "Usuario o contraseña incorrectos";
const LEGACY_BUSINESS_TOKEN_KEY = "access_token";

const getAuthErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiMessageResponse>;

  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

const normalizeSessionUser = (user: BusinessSessionUser): BusinessSessionUser => {
  return {
    ...user,
    permissions: user.permissions ?? [],
    mustChangePassword: Boolean(user.mustChangePassword),
  };
};

const clearLegacyBusinessToken = (): void => {
  localStorage.removeItem(LEGACY_BUSINESS_TOKEN_KEY);
};

const clearBusinessStores = (): void => {
  clearLegacyBusinessToken();
  usePurchaseCartStore.getState().clearCart();
  useBusinessSubscriptionStore.getState().clearSubscription();
};

type AuthState = {
  status: AuthStatus;
  user: BusinessSessionUser | null;
  profileUser: UserInfoResponse | null;
  loading: boolean;
  profileLoading: boolean;
  passwordLoading: boolean;
  passwordFieldErrors: FieldError[];
  error: string | null;

  login: (username: string, password: string) => Promise<AuthActionResult>;
  register: (data: RegisterBody) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUserProfile: (idUser: number) => Promise<void>;
  updateUserPassword: (
    idUser: number,
    currentPassword: string,
    password: string,
  ) => Promise<AuthActionResult & { errors?: FieldError[] }>;
  clearPasswordErrors: () => void;
  expireSession: (message?: string) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "checking",
  user: null,
  profileUser: null,
  loading: false,
  profileLoading: false,
  passwordLoading: false,
  passwordFieldErrors: [],
  error: null,

  login: async (username, password): Promise<AuthActionResult> => {
    set({ loading: true, error: null });

    try {
      clearLegacyBusinessToken();

      const { data: loginRes } = await loginRequest({ username, password });
      const sessionUser = loginRes.data?.user;

      if (!loginRes.status || !sessionUser) {
        set({ status: "unauthenticated", user: null, error: loginRes.message });
        return { success: false, message: loginRes.message };
      }

      const previousBusinessId = get().user?.idBusiness;
      const user = normalizeSessionUser(sessionUser);

      if (previousBusinessId && previousBusinessId !== user.idBusiness) {
        clearBusinessStores();
      }

      set({
        status: "authenticated",
        user,
        profileUser: null,
        error: null,
      });

      return { success: true, message: loginRes.message ?? "Login exitoso" };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiMessageResponse>;
      const msg =
        axiosError.response?.status === 401
          ? INVALID_LOGIN_MESSAGE
          : getAuthErrorMessage(error, "Error al iniciar sesión");

      set({ status: "unauthenticated", user: null, profileUser: null, error: msg });
      return { success: false, message: msg };
    } finally {
      set({ loading: false });
    }
  },

  register: async (dataRegisterPayload): Promise<AuthActionResult> => {
    set({ loading: true, error: null });

    try {
      clearLegacyBusinessToken();

      const { data: dataRegister } = await registerRequest(dataRegisterPayload);
      const sessionUser = dataRegister.data?.user;

      if (!dataRegister.status || !sessionUser) {
        set({
          status: "unauthenticated",
          user: null,
          profileUser: null,
          error: dataRegister.message,
        });
        return { success: false, message: dataRegister.message };
      }

      clearBusinessStores();
      set({
        status: "authenticated",
        user: normalizeSessionUser(sessionUser),
        profileUser: null,
        error: null,
      });

      return {
        success: true,
        message: dataRegister.message ?? "Registro exitoso",
      };
    } catch (error: unknown) {
      const message = getAuthErrorMessage(
        error,
        "Error al registrar el usuario",
      );

      set({
        status: "unauthenticated",
        user: null,
        profileUser: null,
        error: message,
      });
      return { success: false, message };
    } finally {
      set({ loading: false });
    }
  },

  logout: async (): Promise<void> => {
    try {
      await logoutRequest();
    } finally {
      clearBusinessStores();
      set({
        status: "unauthenticated",
        user: null,
        profileUser: null,
        loading: false,
        profileLoading: false,
        passwordLoading: false,
        passwordFieldErrors: [],
        error: null,
      });
    }
  },

  checkAuth: async (): Promise<void> => {
    set({ status: "checking", error: null });

    try {
      clearLegacyBusinessToken();

      const { data } = await meRequest();
      const sessionUser = data.data?.user;

      if (!data.status || !sessionUser) {
        throw new Error(data.message || "Sesion no disponible");
      }

      const previousBusinessId = get().user?.idBusiness;
      const user = normalizeSessionUser(sessionUser);

      if (previousBusinessId && previousBusinessId !== user.idBusiness) {
        clearBusinessStores();
      }

      set({
        status: "authenticated",
        user,
        profileUser: null,
        error: null,
      });
    } catch {
      clearBusinessStores();
      set({ status: "unauthenticated", user: null, profileUser: null });
    }
  },

  fetchUserProfile: async (idUser: number): Promise<void> => {
    set({ profileLoading: true });

    try {
      const { data } = await getUserInfoById(idUser);
      set({ profileUser: data.data, profileLoading: false });
    } catch (error: unknown) {
      const message = getAuthErrorMessage(
        error,
        "No se pudo obtener el perfil del usuario",
      );
      set({ profileUser: null, profileLoading: false, error: message });
    }
  },

  updateUserPassword: async (
    idUser: number,
    currentPassword: string,
    password: string,
  ) => {
    set({ passwordLoading: true, passwordFieldErrors: [], error: null });

    try {
      const { data } = await updatePassword(idUser, {
        currentPassword,
        password,
      });

      const currentUser = get().user;
      if (currentUser?.idUser === idUser) {
        set({
          user: {
            ...currentUser,
            mustChangePassword: false,
          },
          profileUser:
            get().profileUser?.idUser === idUser
              ? {
                  ...get().profileUser!,
                  mustChangePassword: false,
                }
              : get().profileUser,
        });
      }

      return {
        success: true,
        message: data.message || "Contrasena actualizada correctamente",
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<AuthValidationResponse>;
      const errors = axiosError.response?.data?.errors ?? [];
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "No se pudo actualizar la contrasena";

      set({ passwordFieldErrors: errors, error: message });

      return {
        success: false,
        message,
        errors,
      };
    } finally {
      set({ passwordLoading: false });
    }
  },

  clearPasswordErrors: (): void => {
    set({ passwordFieldErrors: [], error: null });
  },

  expireSession: (message = "La sesion expiro"): void => {
    clearBusinessStores();
    set({
      status: "unauthenticated",
      user: null,
      profileUser: null,
      loading: false,
      profileLoading: false,
      passwordLoading: false,
      passwordFieldErrors: [],
      error: message,
    });
  },
}));
