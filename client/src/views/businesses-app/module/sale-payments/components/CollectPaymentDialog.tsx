import { useEffect, useMemo, useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentMethodResponse } from "../../payment-methods/types";
import type { SalePaymentResponse } from "../types";
import {
  formatPaymentMoney,
  getCashPaymentMethods,
  getPaymentMethodLabel,
} from "../helpers/sale-payment.helpers";

type CollectPaymentDialogProps = {
  payment: SalePaymentResponse | null;
  isOpen: boolean;
  loading: boolean;
  paymentMethods: PaymentMethodResponse[];
  onClose: () => void;
  onConfirm: (
    idSalePayment: number,
    body: { idPaymentMethod?: number | null; observation?: string | null },
  ) => Promise<boolean>;
};

export const CollectPaymentDialog = ({
  payment,
  isOpen,
  loading,
  paymentMethods,
  onClose,
  onConfirm,
}: CollectPaymentDialogProps) => {
  const [selectedCashMethodId, setSelectedCashMethodId] = useState("");
  const [observation, setObservation] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const cashPaymentMethods = useMemo(() => {
    return getCashPaymentMethods(paymentMethods);
  }, [paymentMethods]);
  const selectedCashMethod = useMemo(() => {
    return cashPaymentMethods.find((method) => {
      return method.idPaymentMethod === Number(selectedCashMethodId);
    });
  }, [cashPaymentMethods, selectedCashMethodId]);
  const currentMethodIsCash = Boolean(payment?.affectsCash);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => {
      if (currentMethodIsCash && payment) {
        setSelectedCashMethodId(String(payment.idPaymentMethod));
        setFieldError(null);
        return;
      }

      if (cashPaymentMethods.length === 1) {
        setSelectedCashMethodId(String(cashPaymentMethods[0].idPaymentMethod));
        setFieldError(null);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [cashPaymentMethods, currentMethodIsCash, isOpen, payment]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!payment) return;

    if (!currentMethodIsCash && !selectedCashMethodId) {
      setFieldError("Seleccioná un método efectivo para registrar el cobro");
      return;
    }

    if (!currentMethodIsCash && cashPaymentMethods.length === 0) {
      setFieldError("No hay un método efectivo activo para registrar el cobro");
      return;
    }

    const finalMethodId = currentMethodIsCash
      ? null
      : Number(selectedCashMethodId);
    const success = await onConfirm(payment.idSalePayment, {
      idPaymentMethod: finalMethodId,
      observation: observation.trim() || null,
    });

    if (!success) return;

    setSelectedCashMethodId("");
    setObservation("");
    setFieldError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cobrar pago</DialogTitle>
          <DialogDescription>
            El dinero quedará registrado como cobrado por el cadete y pendiente de rendición.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{payment?.paymentMethodName ?? "Pago pendiente"}</p>
            <p className="text-muted-foreground">
              Importe: {formatPaymentMoney(payment?.amount ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Método planificado: {payment?.paymentMethodName ?? "Sin método"}
            </p>
          </div>

          {currentMethodIsCash ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Se conservará el método efectivo actual.
            </p>
          ) : (
            <div className="grid gap-2">
              <Label>Método efectivo final</Label>
              <Select
                value={selectedCashMethodId}
                onValueChange={(value: string | null) => {
                  setSelectedCashMethodId(value ?? "");
                  setFieldError(null);
                }}
                disabled={loading || cashPaymentMethods.length === 0}
              >
                <SelectTrigger className="w-full">
                  <span
                    className={
                      selectedCashMethodId
                        ? "flex flex-1 text-left"
                        : "flex flex-1 text-left text-muted-foreground"
                    }
                  >
                    {getPaymentMethodLabel(selectedCashMethod)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {cashPaymentMethods.map((method) => (
                    <SelectItem
                      key={method.idPaymentMethod}
                      value={String(method.idPaymentMethod)}
                    >
                      {getPaymentMethodLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                El cambio de método se enviará junto con el cobro, en una sola operación.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Observación</Label>
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              disabled={loading}
              maxLength={255}
              placeholder="Detalle opcional del cobro"
            />
          </div>

          {fieldError ? (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {fieldError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading || (!currentMethodIsCash && cashPaymentMethods.length === 0)}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <HandCoins className="mr-2 size-4" />
            )}
            Confirmar cobro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
