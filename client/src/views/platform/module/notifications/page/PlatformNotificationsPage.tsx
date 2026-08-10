import { Archive, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlatformNotifications } from "../hooks/usePlatformNotifications";
import type {
  PlatformNotificationResponse,
  PlatformNotificationSeverity,
} from "../types";

const severityLabels: Record<PlatformNotificationSeverity, string> = {
  INFO: "Informacion",
  SUCCESS: "Exito",
  WARNING: "Advertencia",
  ERROR: "Error",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export const PlatformNotificationsPage = () => {
  const {
    notifications,
    pagination,
    filters,
    loading,
    error,
    applyFilters,
    changePage,
    markAsRead,
    markAllAsRead,
    archive,
  } = usePlatformNotifications(15, true, false);

  const renderNotification = (notification: PlatformNotificationResponse) => (
    <div
      key={notification.idNotification}
      className="grid gap-4 border-b p-4 last:border-b-0 md:grid-cols-[1fr_auto]"
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={notification.isRead ? "outline" : "default"}>
            {notification.isRead ? "Leida" : "Nueva"}
          </Badge>
          <Badge variant="outline">{severityLabels[notification.severity]}</Badge>
          <span className="text-xs text-muted-foreground">{notification.type}</span>
        </div>
        <div>
          <h3 className="font-semibold">{notification.title}</h3>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(notification.createdAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {!notification.isRead && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => markAsRead(notification.idNotification)}
          >
            <CheckCheck className="mr-2 size-4" />
            Marcar leida
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => archive(notification.idNotification)}
        >
          <Archive className="mr-2 size-4" />
          Archivar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones de plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Avisos internos del equipo operativo y auditoria.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={markAllAsRead}>
          <CheckCheck className="mr-2 size-4" />
          Marcar todas como leidas
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.severity ?? ""}
            onChange={(event) =>
              applyFilters({
                severity: event.target.value
                  ? (event.target.value as PlatformNotificationSeverity)
                  : undefined,
              })
            }
          >
            <option value="">Todas las severidades</option>
            <option value="INFO">Informacion</option>
            <option value="SUCCESS">Exito</option>
            <option value="WARNING">Advertencia</option>
            <option value="ERROR">Error</option>
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={filters.unreadOnly ? "1" : ""}
            onChange={(event) =>
              applyFilters({ unreadOnly: event.target.value === "1" })
            }
          >
            <option value="">Todas</option>
            <option value="1">Solo no leidas</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Cargando...</div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No hay notificaciones para mostrar.
            </div>
          ) : (
            notifications.map(renderNotification)
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pagination.currentPage <= 1}
          onClick={() => changePage(pagination.currentPage - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Pagina {pagination.currentPage} de {pagination.totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={pagination.currentPage >= pagination.totalPages}
          onClick={() => changePage(pagination.currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};
