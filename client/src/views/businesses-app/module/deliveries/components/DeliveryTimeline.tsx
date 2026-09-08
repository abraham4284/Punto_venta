import { Clock3, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  formatDeliveryDate,
  getDeliveryEventLabel,
  getDeliveryMetadataLines,
  getDeliveryStatusLabel,
} from "../helpers/delivery.helpers";
import type { DeliveryEventResponse } from "../types";

type DeliveryTimelineProps = {
  events: DeliveryEventResponse[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export const DeliveryTimeline = ({
  events,
  loading,
  error,
  onRetry,
}: DeliveryTimelineProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="size-4" />
          Historial de entrega
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex min-h-24 items-center justify-center gap-2 text-muted-foreground">
            <Spinner />
            Cargando eventos...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={onRetry}
            >
              <RefreshCw className="mr-2 size-4" />
              Reintentar
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
            Sin eventos registrados para esta entrega.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => {
              const metadataLines = getDeliveryMetadataLines(event.metadata);
              const hasTransition = event.previousStatus || event.newStatus;

              return (
                <article key={event.idDeliveryEvent} className="relative pl-6">
                  {index < events.length - 1 ? (
                    <span className="absolute left-2 top-5 h-full w-px bg-border" />
                  ) : null}
                  <span className="absolute left-0 top-1 flex size-4 items-center justify-center rounded-full bg-primary">
                    <span className="size-1.5 rounded-full bg-primary-foreground" />
                  </span>
                  <div className="rounded-xl border bg-card p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {getDeliveryEventLabel(event.eventType)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.createdByUserName || "Sistema"} ·{" "}
                          {formatDeliveryDate(event.createdAt)}
                        </p>
                      </div>
                      {hasTransition ? (
                        <Badge variant="outline">
                          {getDeliveryStatusLabel(event.previousStatus)} →{" "}
                          {getDeliveryStatusLabel(event.newStatus)}
                        </Badge>
                      ) : null}
                    </div>
                    {metadataLines.length > 0 ? (
                      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                        {metadataLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
