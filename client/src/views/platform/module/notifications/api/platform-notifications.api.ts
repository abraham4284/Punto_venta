import { axiosInstance } from "@/api/axios.config";
import type {
  PlatformNotificationFilters,
  PlatformNotificationListResponse,
} from "../types";

const buildParams = (filters: PlatformNotificationFilters): URLSearchParams => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
};

export const getPlatformNotifications = async (
  filters: PlatformNotificationFilters = {},
): Promise<PlatformNotificationListResponse> => {
  const params = buildParams(filters);
  const { data } = await axiosInstance.get(
    `/platform/notifications?${params.toString()}`,
  );
  return data.data;
};

export const getPlatformUnreadNotificationCount = async (): Promise<number> => {
  const { data } = await axiosInstance.get("/platform/notifications/unread-count");
  return Number(data.data?.unreadCount ?? 0);
};

export const markPlatformNotificationRead = async (
  idNotification: number,
): Promise<void> => {
  await axiosInstance.patch(`/platform/notifications/${idNotification}/read`);
};

export const markAllPlatformNotificationsRead = async (): Promise<void> => {
  await axiosInstance.patch("/platform/notifications/read-all");
};

export const archivePlatformNotification = async (
  idNotification: number,
): Promise<void> => {
  await axiosInstance.patch(`/platform/notifications/${idNotification}/archive`);
};
