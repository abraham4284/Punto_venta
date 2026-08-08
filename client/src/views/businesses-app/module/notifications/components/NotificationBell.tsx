import { useState } from "react";
import { Archive, Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationResponse } from "../types";

const severityClass: Record<NotificationResponse["severity"], string> = {
  INFO: "border-blue-200 bg-blue-50 text-blue-700",
  SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-700",
  WARNING: "border-amber-200 bg-amber-50 text-amber-700",
  ERROR: "border-red-200 bg-red-50 text-red-700",
};

const formatCount = (count: number) => (count > 99 ? "99+" : String(count));

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archive,
  } = useNotifications(10, false);

  const handleToggle = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      await fetchNotifications({ page: 1, limit: 10 });
    }
  };

  const handleOpenNotification = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      await markAsRead(notification.idNotification);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative"
        onClick={handleToggle}
        aria-label="Notificaciones"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {formatCount(unreadCount)}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-11 z-50 w-[min(92vw,420px)] border-slate-200 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-base">Notificaciones</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="mr-2 size-4" />
              Leer todo
            </Button>
          </CardHeader>
          <CardContent className="max-h-[440px] overflow-y-auto p-0">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No tenes notificaciones pendientes.
              </div>
            ) : (
              <div className="divide-y">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.idNotification}
                    className={cn(
                      "flex gap-3 p-4 transition hover:bg-muted/60",
                      !notification.isRead && "bg-muted/40",
                    )}
                  >
                    <Badge
                      variant="outline"
                      className={cn("h-6 shrink-0", severityClass[notification.severity])}
                    >
                      {notification.severity}
                    </Badge>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleOpenNotification(notification)}
                    >
                      <p className="truncate text-sm font-semibold">
                        {notification.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => archive(notification.idNotification)}
                      aria-label="Archivar"
                    >
                      <Archive className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t p-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigate("/admin/notifications");
                  setIsOpen(false);
                }}
              >
                <ExternalLink className="mr-2 size-4" />
                Ver todas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
