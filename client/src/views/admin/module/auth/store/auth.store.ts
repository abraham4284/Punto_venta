import { create } from "zustand";
import type { AxiosError } from "axios";
import type { ApiMessageResponse } from "@/api/axios.response.type";
import {
  getUserInfoById,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
} from "@/views/admin/module/auth/api/auth.api";
import type { User, UserInfoResponse } from "@/views/admin/module/auth/types/auth.types";

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
  error: string | null;

  login: (username: string, password: string) => Promise<AuthActionResult>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUserProfile: (idUser: number) => Promise<void>;
  expireSession: (message?: string) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "checking",
  user: null,
  profileUser: null,
  loading: false,
  profileLoading: false,
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

      const { data: meRes } = await meRequest();
      if (!meRes.status) {
        set({ status: "unauthenticated", user: null, error: meRes.message });
        return { success: false, message: meRes.message };
      }

      set({
        status: "authenticated",
        user: meRes.data,
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

  async register(username, password) {
    set({ loading: true, error: null });
    try {
      const { data: dataRegister } = await registerRequest({
        username,
        password,
      });
      if (!dataRegister.status) {
        set({
          status: "unauthenticated",
          user: null,
          loading: false,
          error: dataRegister.message,
        });
      }
      const { data } = await meRequest();
      if (!data.status) {
        set({
          status: "unauthenticated",
          user: null,
          loading: false,
          error: data.message,
        });
      }
      set({
        status: "authenticated",
        user: data.data,
        loading: false,
        error: null,
      });
      await get().fetchUserProfile(data.data.idUser);
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
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  async logout() {
    await logoutRequest();
    set({
      status: "unauthenticated",
      user: null,
      profileUser: null,
      loading: false,
      profileLoading: false,
      error: "error",
    });
  },

  async checkAuth() {
    set({ status: "checking", error: null });

    try {
      const { data } = await meRequest();
      set({ status: "authenticated", user: data.data });
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

  expireSession(message = "La sesion expiro") {
    set({
      status: "unauthenticated",
      user: null,
      profileUser: null,
      loading: false,
      profileLoading: false,
      error: message,
    });
  },
}));
