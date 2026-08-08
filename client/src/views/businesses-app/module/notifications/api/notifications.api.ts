import { axiosInstance } from "@/api/axios.config";
import type {
  NotificationFilters,
  NotificationListResponse,
} from "../types";

const buildParams = (filters: NotificationFilters): URLSearchParams => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
};

export const getNotifications = async (
  filters: NotificationFilters = {},
): Promise<NotificationListResponse> => {
  const params = buildParams(filters);
  const { data } = await axiosInstance.get(`/notifications?${params.toString()}`);
  return data.data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const { data } = await axiosInstance.get("/notifications/unread-count");
  return Number(data.data?.unreadCount ?? 0);
};

export const markNotificationRead = async (
  idNotification: number,
): Promise<void> => {
  await axiosInstance.patch(`/notifications/${idNotification}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosInstance.patch("/notifications/read-all");
};

export const archiveNotification = async (
  idNotification: number,
): Promise<void> => {
  await axiosInstance.patch(`/notifications/${idNotification}/archive`);
};
