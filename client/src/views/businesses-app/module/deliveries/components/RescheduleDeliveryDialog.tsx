import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryResponse } from "../types";

type RescheduleDeliveryDialogProps = {
  delivery: DeliveryResponse | null;
  actionLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    idSaleDelivery: number,
    data: { scheduledAt?: string | null; observation?: string | null },
  ) => Promise<boolean>;
};

export const RescheduleDeliveryDialog = ({
  delivery,
  actionLoading,
  isOpen,
  onClose,
  onConfirm,
}: RescheduleDeliveryDialogProps) => {
  const [scheduledAt, setScheduledAt] = useState("");
  const [observation, setObservation] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open && !actionLoading) {
      setScheduledAt("");
      setObservation("");
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!delivery) return;

    const success = await onConfirm(delivery.idSaleDelivery, {
      scheduledAt: scheduledAt || null,
      observation: observation.trim() || null,
    });

    if (!success) {
      return;
    }

    setScheduledAt("");
    setObservation("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reagendar entrega</DialogTitle>
          <DialogDescription>
            La entrega volverá a Pendiente y quedará sin cadete asignado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nueva fecha programada</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              disabled={actionLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label>Observación</Label>
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              maxLength={255}
              placeholder="Detalle opcional del reagendado"
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
            disabled={actionLoading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {actionLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CalendarClock className="mr-2 size-4" />
            )}
            Reagendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
