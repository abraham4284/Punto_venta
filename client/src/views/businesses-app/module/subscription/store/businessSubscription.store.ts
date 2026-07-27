import { create } from "zustand";
import type { AxiosError } from "axios";
import { getBusinessSubscriptionRequest } from "../api/businessSubscription.api";
import type {
  BusinessSubscriptionApiResponse,
  BusinessSubscriptionResponse,
} from "../types/businessSubscription.types";

type BusinessSubscriptionState = {
  subscriptionState: BusinessSubscriptionResponse | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  clearSubscription: () => void;
};

const getSubscriptionErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<BusinessSubscriptionApiResponse>;
  return (
    axiosError.response?.data?.message ||
    axiosError.message ||
    "No se pudo obtener el estado comercial del negocio"
  );
};

export const useBusinessSubscriptionStore = create<BusinessSubscriptionState>(
  (set, get) => ({
    subscriptionState: null,
    loading: false,
    error: null,
    lastFetchedAt: null,

    fetchSubscription: async () => {
      if (get().loading) return;

      set({ loading: true, error: null });

      try {
        const { data } = await getBusinessSubscriptionRequest();
        set({
          subscriptionState: data.data,
          loading: false,
          error: null,
          lastFetchedAt: Date.now(),
        });
      } catch (error: unknown) {
        set({
          loading: false,
          error: getSubscriptionErrorMessage(error),
        });
      }
    },

    refreshSubscription: async () => {
      await get().fetchSubscription();
    },

    clearSubscription: () => {
      set({
        subscriptionState: null,
        loading: false,
        error: null,
        lastFetchedAt: null,
      });
    },
  }),
);

export const useCanOperate = (): boolean => {
  return useBusinessSubscriptionStore(
    (state) => state.subscriptionState?.access.canOperate ?? false,
  );
};

export const useSubscriptionPlan = () => {
  return useBusinessSubscriptionStore((state) => state.subscriptionState?.plan ?? null);
};

export const useSubscriptionStatus = () => {
  return useBusinessSubscriptionStore(
    (state) => state.subscriptionState?.subscription?.status ?? null,
  );
};

export const useSubscriptionNotification = () => {
  return useBusinessSubscriptionStore(
    (state) => state.subscriptionState?.notification ?? null,
  );
};

export const useSubscriptionTimeline = () => {
  return useBusinessSubscriptionStore(
    (state) => state.subscriptionState?.timeline ?? null,
  );
};
