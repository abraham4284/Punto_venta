import { useMemo, useState } from "react";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cancelReasonSchema, reasonSchema } from "../../validations/subscriptions.validations";
import type { BusinessSubscription } from "../../types/subscriptions.types";

type ActionType = "SUSPEND" | "CANCEL";

interface SubscriptionActionReasonModalProps {
  isOpen: boolean;
  actionType: ActionType;
  subscription: BusinessSubscription | null;
  isSaving: boolean;
  onClose: () => void;
  onSuspend: (idBusinessSubscription: number, reason: string) => void;
  onCancel: (
    idBusinessSubscription: number,
    reason: string,
    cancelAtPeriodEnd: boolean,
  ) => void;
}

export const SubscriptionActionReasonModal = ({
  isOpen,
  actionType,
  subscription,
  isSaving,
  onClose,
  onSuspend,
  onCancel,
}: SubscriptionActionReasonModalProps) => {
  const [reason, setReason] = useState("");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const config = useMemo(() => {
    if (actionType === "SUSPEND") {
      return {
        title: "Suspender suscripcion",
        description:
          "El negocio perdera acceso operativo inmediatamente hasta que la suscripcion sea reactivada.",
        actionLabel: "Suspender",
      };
    }

    return {
      title: "Cancelar suscripcion",
      description:
        "La cancelacion puede aplicarse ahora o programarse al final del periodo comercial actual.",
      actionLabel: "Cancelar suscripcion",
    };
  }, [actionType]);

  const handleClose = () => {
    setReason("");
    setCancelAtPeriodEnd(false);
    setFieldError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!subscription) return;

    try {
      setFieldError(null);

      if (actionType === "SUSPEND") {
        const data = reasonSchema.parse({ reason });
        onSuspend(subscription.idBusinessSubscription, data.reason);
        return;
      }

      const data = cancelReasonSchema.parse({ reason, cancelAtPeriodEnd });
      onCancel(
        subscription.idBusinessSubscription,
        data.reason,
        data.cancelAtPeriodEnd,
      );
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        setFieldError(error.errors[0]?.message || "Ingrese un motivo valido");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{subscription?.business.name || "-"}</p>
            <p className="text-muted-foreground">
              {subscription?.plan.name || "-"} - {subscription?.status || "-"}
            </p>
          </div>

          {actionType === "CANCEL" && (
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label>Cancelar al final del periodo</Label>
                <p className="text-xs text-muted-foreground">
                  Mantiene el acceso hasta el vencimiento actual.
                </p>
              </div>
              <Switch
                checked={cancelAtPeriodEnd}
                disabled={isSaving}
                onCheckedChange={setCancelAtPeriodEnd}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subscription-reason">Motivo administrativo</Label>
            <Textarea
              id="subscription-reason"
              value={reason}
              disabled={isSaving}
              onChange={(event) => {
                setReason(event.target.value);
                setFieldError(null);
              }}
              placeholder="Ej: Falta de pago confirmada por administracion"
              className="min-h-28"
            />
            {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSaving} onClick={handleClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant={actionType === "CANCEL" ? "destructive" : "default"}
            disabled={isSaving}
            onClick={handleSubmit}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {config.actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
