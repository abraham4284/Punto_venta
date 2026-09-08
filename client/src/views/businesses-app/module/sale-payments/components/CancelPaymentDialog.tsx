import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
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
import type { SalePaymentResponse } from "../types";
import { formatPaymentMoney } from "../helpers/sale-payment.helpers";

type CancelPaymentDialogProps = {
  payment: SalePaymentResponse | null;
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (idSalePayment: number, reason: string | null) => Promise<boolean>;
};

export const CancelPaymentDialog = ({
  payment,
  isOpen,
  loading,
  onClose,
  onConfirm,
}: CancelPaymentDialogProps) => {
  const [reason, setReason] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!payment) return;

    const success = await onConfirm(payment.idSalePayment, reason.trim() || null);

    if (!success) return;

    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anular pago pendiente</DialogTitle>
          <DialogDescription>
            Anular este pago no anula la venta. La fila seguirá visible para auditoría.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{payment?.paymentMethodName ?? "Pago"}</p>
            <p className="text-muted-foreground">
              Importe: {formatPaymentMoney(payment?.amount ?? 0)}
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Motivo</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={loading}
              maxLength={255}
              placeholder="Motivo opcional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Ban className="mr-2 size-4" />
            )}
            Anular pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
