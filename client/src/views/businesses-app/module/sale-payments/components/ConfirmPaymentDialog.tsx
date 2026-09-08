import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CashSessionResponse } from "../../cash/types";
import type { SalePaymentResponse } from "../types";
import { formatPaymentMoney } from "../helpers/sale-payment.helpers";

type ConfirmPaymentDialogProps = {
  payment: SalePaymentResponse | null;
  isOpen: boolean;
  loading: boolean;
  cashSessionLoading: boolean;
  currentCashSession: CashSessionResponse | null;
  onClose: () => void;
  onLoadCashSession: () => Promise<CashSessionResponse | null>;
  onConfirm: (idSalePayment: number, idCashSession: number) => Promise<boolean>;
};

export const ConfirmPaymentDialog = ({
  payment,
  isOpen,
  loading,
  cashSessionLoading,
  currentCashSession,
  onClose,
  onLoadCashSession,
  onConfirm,
}: ConfirmPaymentDialogProps) => {
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      setFieldError(null);
      onClose();
    }
  };

  const handleCancel = () => {
    if (loading) return;

    setFieldError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!payment) return;

    const cashSession = currentCashSession ?? (await onLoadCashSession());

    if (!cashSession || cashSession.status !== "OPEN") {
      setFieldError("Debes abrir una caja para confirmar este pago");
      return;
    }

    const success = await onConfirm(payment.idSalePayment, cashSession.idCashSession);

    if (!success) return;

    setFieldError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar pago</DialogTitle>
          <DialogDescription>
            El pago quedará reconocido por el negocio y asociado a la sesión de caja abierta actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{payment?.paymentMethodName ?? "Pago"}</p>
            <p className="text-muted-foreground">
              Importe: {formatPaymentMoney(payment?.amount ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Caja: {currentCashSession?.cashRegisterName ?? "Se validará al confirmar"}
            </p>
          </div>

          {fieldError ? (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {fieldError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading || cashSessionLoading}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading || cashSessionLoading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {loading || cashSessionLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 size-4" />
            )}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
