import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  formatPaymentDate,
  formatPaymentMoney,
  getSalePaymentEventLabel,
  getSalePaymentMetadataLines,
  getSalePaymentStatusLabel,
} from "../helpers/sale-payment.helpers";
import type { SalePaymentEventResponse, SalePaymentResponse } from "../types";

type PaymentEventsDialogProps = {
  payment: SalePaymentResponse | null;
  isOpen: boolean;
  events: SalePaymentEventResponse[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: (idSalePayment: number) => void;
};

export const PaymentEventsDialog = ({
  payment,
  isOpen,
  events,
  loading,
  error,
  onClose,
  onRetry,
}: PaymentEventsDialogProps) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Historial del pago</DialogTitle>
          <DialogDescription>
            Eventos de auditoría del pago seleccionado, cargados bajo demanda.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">{payment?.paymentMethodName ?? "Pago"}</p>
              <p className="text-muted-foreground">
                Estado actual: {getSalePaymentStatusLabel(payment?.status ?? null)}
              </p>
            </div>
            <p className="text-lg font-bold">
              {formatPaymentMoney(payment?.amount ?? 0)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground">
            <Spinner />
            Cargando historial...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{error}</p>
            {payment ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => onRetry(payment.idSalePayment)}
              >
                <RefreshCw className="mr-2 size-4" />
                Reintentar
              </Button>
            ) : null}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No hay eventos registrados para este pago.
          </div>
        ) : (
          <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {events.map((event, index) => {
              const metadataLines = getSalePaymentMetadataLines(event.metadata);
              const hasTransition = event.previousStatus || event.newStatus;

              return (
                <article key={event.idSalePaymentEvent} className="relative pl-6">
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
                          {getSalePaymentEventLabel(event.eventType)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.createdByUserName || "Sistema"} ·{" "}
                          {formatPaymentDate(event.createdAt)}
                        </p>
                      </div>
                      {hasTransition ? (
                        <Badge variant="outline">
                          {getSalePaymentStatusLabel(event.previousStatus)} →{" "}
                          {getSalePaymentStatusLabel(event.newStatus)}
                        </Badge>
                      ) : null}
                    </div>
                    {event.eventType === "PAYMENT_SETTLED" ? (
                      <p className="mt-2 rounded-lg bg-violet-50 p-2 text-xs text-violet-700">
                        Pago rendido por caja: pasó de cobrado por cadete a confirmado.
                      </p>
                    ) : null}
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

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
