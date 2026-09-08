import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryResponse } from "../types";

type FailDeliveryDialogProps = {
  delivery: DeliveryResponse | null;
  actionLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    idSaleDelivery: number,
    data: { failureReason: string; observation?: string | null },
  ) => Promise<void>;
};

export const FailDeliveryDialog = ({
  delivery,
  actionLoading,
  isOpen,
  onClose,
  onConfirm,
}: FailDeliveryDialogProps) => {
  const [failureReason, setFailureReason] = useState("");
  const [observation, setObservation] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !actionLoading) {
      setFailureReason("");
      setObservation("");
      setFieldError(null);
      onClose();
    }
  };

  const handleConfirm = async () => {
    const reason = failureReason.trim();

    if (!delivery) return;

    if (reason.length < 3) {
      setFieldError("Ingresá un motivo claro para marcar la entrega como fallida");
      return;
    }

    await onConfirm(delivery.idSaleDelivery, {
      failureReason: reason,
      observation: observation.trim() || null,
    });
    setFailureReason("");
    setObservation("");
    setFieldError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Marcar entrega fallida</DialogTitle>
          <DialogDescription>
            Registrá el motivo operativo. La entrega quedará disponible para reagendar o cancelar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Motivo de falla</Label>
            <Textarea
              value={failureReason}
              onChange={(event) => {
                setFailureReason(event.target.value);
                setFieldError(null);
              }}
              maxLength={255}
              placeholder="Ej: el cliente no se encontraba en el domicilio"
              disabled={actionLoading}
            />
            {fieldError ? (
              <p className="text-sm text-destructive">{fieldError}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Observación interna</Label>
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              maxLength={255}
              placeholder="Detalle opcional"
              disabled={actionLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={actionLoading}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={actionLoading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {actionLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 size-4" />
            )}
            Marcar fallida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
