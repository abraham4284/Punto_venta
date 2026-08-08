import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  archivePlatformNotification,
  getPlatformNotifications,
  getPlatformUnreadNotificationCount,
  markAllPlatformNotificationsRead,
  markPlatformNotificationRead,
} from "../api/platform-notifications.api";
import type {
  PlatformNotificationFilters,
  PlatformNotificationListResponse,
  PlatformNotificationResponse,
} from "../types";

export const usePlatformNotifications = (initialLimit = 15, autoFetchList = true) => {
  const [notifications, setNotifications] = useState<PlatformNotificationResponse[]>([]);
  const [pagination, setPagination] =
    useState<PlatformNotificationListResponse["pagination"]>({
      totalRecords: 0,
      currentPage: 1,
      totalPages: 1,
      limit: initialLimit,
    });
  const [filters, setFilters] = useState<PlatformNotificationFilters>({
    page: 1,
    limit: initialLimit,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getPlatformUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(
    async (overrideFilters?: PlatformNotificationFilters) => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPlatformNotifications({
          ...filters,
          ...overrideFilters,
        });
        setNotifications(response.notifications);
        setPagination(response.pagination);
      } catch {
        setError("No se pudieron obtener las notificaciones");
        toast.error("No se pudieron obtener las notificaciones");
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  const applyFilters = (nextFilters: PlatformNotificationFilters) => {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: 1,
      limit: current.limit ?? initialLimit,
    }));
  };

  const changePage = (page: number) => {
    setFilters((current) => ({ ...current, page }));
  };

  const markAsRead = async (idNotification: number) => {
    await markPlatformNotificationRead(idNotification);
    setNotifications((current) =>
      current.map((notification) =>
        notification.idNotification === idNotification
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification,
      ),
    );
    await fetchUnreadCount();
  };

  const markAllAsRead = async () => {
    await markAllPlatformNotificationsRead();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  };

  const archive = async (idNotification: number) => {
    await archivePlatformNotification(idNotification);
    setNotifications((current) =>
      current.filter((notification) => notification.idNotification !== idNotification),
    );
    await fetchUnreadCount();
  };

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = window.setInterval(fetchUnreadCount, 60000);
    const handleFocus = () => {
      void fetchUnreadCount();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!autoFetchList) {
      return;
    }

    void fetchNotifications();
  }, [autoFetchList, filters.page, fetchNotifications]);

  return {
    notifications,
    pagination,
    filters,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    applyFilters,
    changePage,
    markAsRead,
    markAllAsRead,
    archive,
  };
};
