import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "../../helpers/subscription-format.helpers";
import type { SubscriptionEvent } from "../../types/subscriptions.types";
import { EventBadge, SubscriptionStatusBadge } from "../shared/SubscriptionBadges";

interface SubscriptionEventsTableProps {
  events: SubscriptionEvent[];
  loading: boolean;
}

export const SubscriptionEventsTable = ({
  events,
  loading,
}: SubscriptionEventsTableProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Estado anterior</TableHead>
                <TableHead>Estado nuevo</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    Cargando auditoria...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    No hay eventos para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.idSubscriptionEvent}>
                    <TableCell>{formatDateTime(event.createdAt)}</TableCell>
                    <TableCell>
                      <EventBadge eventType={event.eventType} />
                    </TableCell>
                    <TableCell>{event.businessName || "-"}</TableCell>
                    <TableCell>
                      {event.previousStatus ? (
                        <SubscriptionStatusBadge status={event.previousStatus} />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {event.newStatus ? (
                        <SubscriptionStatusBadge status={event.newStatus} />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{event.createdByUserName || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
