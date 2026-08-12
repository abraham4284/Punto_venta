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
  FieldError,
  RegisterBody,
  User,
  UserInfoResponse,
} from "@/views/businesses-app/module/auth/types/auth.types";
import { usePurchaseCartStore } from "@/views/businesses-app/module/purchases/store/purchaseCart.store";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";
type AuthActionResult =
  | { success: true; message: string }
  | { success: false; message: string | undefined };

const getAuthErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiMessageResponse>;

  return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
};

type AuthState = {
  status: AuthStatus;
  user: User | null;
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
  isAutenticated: false,

  async login(username, password): Promise<AuthActionResult> {
    set({ loading: true, error: null });

    try {
      const { data: loginRes } = await loginRequest({ username, password });

      if (!loginRes.status) {
        set({ status: "unauthenticated", user: null, error: loginRes.message });
        return { success: false, message: loginRes.message };
      }

      if (loginRes.data?.accessToken) {
        localStorage.setItem("access_token", loginRes.data.accessToken);
      }

      const { data: meRes } = await meRequest();
      if (!meRes.status) {
        set({ status: "unauthenticated", user: null, error: meRes.message });
        return { success: false, message: meRes.message };
      }

      const previousBusinessId = get().user?.idBusiness;

      if (
        previousBusinessId &&
        previousBusinessId !== meRes.data.idBusiness
      ) {
        usePurchaseCartStore.getState().clearCart();
      }

      set({
        status: "authenticated",
        user: {
          ...meRes.data,
          mustChangePassword: meRes.data.mustChangePassword,
          permissions: meRes.data.permissions ?? [],
        },
        error: null,
      });
      await get().fetchUserProfile(meRes.data.idUser);

      return { success: true, message: loginRes.message ?? "Login exitoso" };
    } catch (error: unknown) {
      const e = error as AxiosError<ApiMessageResponse>;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Error al iniciar sesión";
      set({ status: "unauthenticated", user: null, error: msg });
      return { success: false, message: msg };
    } finally {
      set({ loading: false });
    }
  },

  async register(dataRegisterPayload): Promise<AuthActionResult> {
    set({ loading: true, error: null });
    try {
      const { data: dataRegister } = await registerRequest(dataRegisterPayload);
      if (!dataRegister.status) {
        set({
          status: "unauthenticated",
          user: null,
          loading: false,
          error: dataRegister.message,
        });
        return { success: false, message: dataRegister.message };
      }

      if (dataRegister.data?.accessToken) {
        localStorage.setItem("access_token", dataRegister.data.accessToken);
      }

      const registeredUser = dataRegister.data?.user;
      const user = registeredUser
        ? {
            idUser: registeredUser.idUser,
            idBusiness: registeredUser.idBusiness,
            role: registeredUser.role,
            name: registeredUser.name,
            username: registeredUser.username,
            email: registeredUser.email,
            businessName: registeredUser.businessName,
            businessSlug: registeredUser.businessSlug,
            businessType: registeredUser.businessType,
            logoUrl: registeredUser.logoUrl,
            mustChangePassword: registeredUser.mustChangePassword,
            permissions: registeredUser.permissions ?? [],
          }
        : null;

      if (!user) {
        const { data } = await meRequest();
        if (!data.status) {
          set({
            status: "unauthenticated",
            user: null,
            loading: false,
            error: data.message,
          });
          return { success: false, message: data.message };
        }
        usePurchaseCartStore.getState().clearCart();
        set({
          status: "authenticated",
          user: {
            ...data.data,
            permissions: data.data.permissions ?? [],
          },
          loading: false,
          error: null,
        });
        await get().fetchUserProfile(data.data.idUser);
        return {
          success: true,
          message: dataRegister.message ?? "Registro exitoso",
        };
      }

      usePurchaseCartStore.getState().clearCart();
      set({
        status: "authenticated",
        user,
        loading: false,
        error: null,
      });
      await get().fetchUserProfile(user.idUser);
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
        loading: false,
        error: message,
      });
      return { success: false, message };
    } finally {
      set({ loading: false });
    }
  },

  async logout() {
    await logoutRequest();
    localStorage.removeItem("access_token");
    usePurchaseCartStore.getState().clearCart();
    set({
      status: "unauthenticated",
      user: null,
      profileUser: null,
      loading: false,
      profileLoading: false,
      passwordLoading: false,
      passwordFieldErrors: [],
      error: "error",
    });
  },

  async checkAuth() {
    set({ status: "checking", error: null });

    try {
      const { data } = await meRequest();
      const previousBusinessId = get().user?.idBusiness;

      if (
        previousBusinessId &&
        previousBusinessId !== data.data.idBusiness
      ) {
        usePurchaseCartStore.getState().clearCart();
      }

      set({
        status: "authenticated",
        user: {
          ...data.data,
          permissions: data.data.permissions ?? [],
        },
      });
      await get().fetchUserProfile(data.data.idUser);
    } catch {
      set({ status: "unauthenticated", user: null, profileUser: null });
    }
  },

  async fetchUserProfile(idUser: number) {
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

  async updateUserPassword(
    idUser: number,
    currentPassword: string,
    password: string,
  ) {
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

  clearPasswordErrors() {
    set({ passwordFieldErrors: [], error: null });
  },

  expireSession(message = "La sesion expiro") {
    localStorage.removeItem("access_token");
    usePurchaseCartStore.getState().clearCart();
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
