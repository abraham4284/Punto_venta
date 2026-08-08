import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  archiveNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.api";
import type {
  NotificationFilters,
  NotificationListResponse,
  NotificationResponse,
} from "../types";

const initialPagination = {
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 15,
};

export const useNotifications = (initialLimit = 15, autoFetchList = true) => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [pagination, setPagination] =
    useState<NotificationListResponse["pagination"]>(initialPagination);
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: initialLimit,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setCountLoading(true);
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    } finally {
      setCountLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(
    async (overrideFilters?: NotificationFilters) => {
      try {
        setLoading(true);
        setError(null);
        const response = await getNotifications({
          ...filters,
          ...overrideFilters,
        });
        setNotifications(response.notifications);
        setPagination(response.pagination);
      } catch (requestError) {
        setError("No se pudieron obtener las notificaciones");
        toast.error("No se pudieron obtener las notificaciones");
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  const applyFilters = (nextFilters: NotificationFilters) => {
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
    await markNotificationRead(idNotification);
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
    await markAllNotificationsRead();
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
    await archiveNotification(idNotification);
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
    countLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    applyFilters,
    changePage,
    markAsRead,
    markAllAsRead,
    archive,
  };
};
