import { useEffect, useMemo, useState } from "react";
import { Decimal } from "decimal.js";
import { Loader2, Save } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CashSessionResponse } from "../../cash/types";
import type { PaymentMethodResponse } from "../../payment-methods/types";
import type {
  CreateSalePaymentBody,
  SalePaymentResponse,
  UpdateSalePaymentBody,
} from "../types";
import {
  formatPaymentMoney,
  getPaymentMethodLabel,
} from "../helpers/sale-payment.helpers";

type PaymentFormValues = {
  idPaymentMethod: string;
  amount: string;
  status: "PENDING" | "CONFIRMED";
  reference: string;
  observation: string;
};

type PaymentFormDialogProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  payment: SalePaymentResponse | null;
  saleTotal: number;
  remaining: number;
  hasDelivery: boolean;
  saleCancelled: boolean;
  paymentMethods: PaymentMethodResponse[];
  saving: boolean;
  cashSessionLoading: boolean;
  currentCashSession: CashSessionResponse | null;
  onClose: () => void;
  onLoadCashSession: () => Promise<CashSessionResponse | null>;
  onCreate: (body: CreateSalePaymentBody) => Promise<boolean>;
  onUpdate: (
    idSalePayment: number,
    body: UpdateSalePaymentBody,
  ) => Promise<boolean>;
};

const initialValues: PaymentFormValues = {
  idPaymentMethod: "",
  amount: "",
  status: "PENDING",
  reference: "",
  observation: "",
};

export const PaymentFormDialog = ({
  isOpen,
  mode,
  payment,
  saleTotal,
  remaining,
  hasDelivery,
  saleCancelled,
  paymentMethods,
  saving,
  cashSessionLoading,
  currentCashSession,
  onClose,
  onLoadCashSession,
  onCreate,
  onUpdate,
}: PaymentFormDialogProps) => {
  const [formState, setFormState] = useState<PaymentFormValues>(initialValues);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const selectedMethod = useMemo(() => {
    return paymentMethods.find((method) => {
      return method.idPaymentMethod === Number(formState.idPaymentMethod);
    });
  }, [formState.idPaymentMethod, paymentMethods]);
  const availableRemaining =
    mode === "edit" && payment
      ? Number(new Decimal(remaining).plus(payment.amount).toDecimalPlaces(2))
      : remaining;

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => {
      if (mode === "edit" && payment) {
        setFormState({
          idPaymentMethod: String(payment.idPaymentMethod),
          amount: String(payment.amount),
          status: "PENDING",
          reference: payment.reference ?? "",
          observation: payment.observation ?? "",
        });
        setFieldError(null);
        return;
      }

      setFormState({
        ...initialValues,
        status: hasDelivery ? "PENDING" : "CONFIRMED",
      });
      setFieldError(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [hasDelivery, isOpen, mode, payment]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !saving) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    const amount = Number(formState.amount);
    const idPaymentMethod = Number(formState.idPaymentMethod);

    if (!idPaymentMethod) {
      setFieldError("Seleccioná un método de pago");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldError("Ingresá un importe mayor a cero");
      return;
    }

    if (amount > availableRemaining || amount > saleTotal) {
      setFieldError("El importe supera el saldo disponible de la venta");
      return;
    }

    if (mode === "create" && formState.status === "PENDING" && !hasDelivery) {
      setFieldError("Los pagos pendientes se usan solamente en ventas con envío");
      return;
    }

    let cashSession = currentCashSession;

    if (formState.status === "CONFIRMED") {
      cashSession = cashSession ?? (await onLoadCashSession());

      if (!cashSession || cashSession.status !== "OPEN") {
        setFieldError("Debes abrir una caja para confirmar este pago");
        return;
      }
    }

    const baseBody = {
      idPaymentMethod,
      amount,
      reference: formState.reference.trim() || null,
      observation: formState.observation.trim() || null,
    };

    const success =
      mode === "edit" && payment
        ? await onUpdate(payment.idSalePayment, baseBody)
        : await onCreate({
            ...baseBody,
            status: formState.status,
            idCashSession:
              formState.status === "CONFIRMED"
                ? cashSession?.idCashSession ?? null
                : null,
          });

    if (!success) {
      return;
    }

    setFormState(initialValues);
    setFieldError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar pago pendiente" : "Agregar pago"}
          </DialogTitle>
          <DialogDescription>
            Saldo disponible: {formatPaymentMoney(availableRemaining)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Método de pago</Label>
            <Select
              value={formState.idPaymentMethod}
              onValueChange={(value: string | null) => {
                setFormState((current) => ({
                  ...current,
                  idPaymentMethod: value ?? "",
                }));
                setFieldError(null);
              }}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <span
                  className={
                    formState.idPaymentMethod
                      ? "flex flex-1 text-left"
                      : "flex flex-1 text-left text-muted-foreground"
                  }
                >
                  {getPaymentMethodLabel(selectedMethod)}
                </span>
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem
                    key={method.idPaymentMethod}
                    value={String(method.idPaymentMethod)}
                  >
                    {getPaymentMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "create" ? (
            <div className="grid gap-2">
              <Label>Estado inicial</Label>
              <Select
                value={formState.status}
                onValueChange={(value: string | null) => {
                  setFormState((current) => ({
                    ...current,
                    status: value === "CONFIRMED" ? "CONFIRMED" : "PENDING",
                  }));
                  setFieldError(null);
                }}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <span className="flex flex-1 text-left">
                    {formState.status === "CONFIRMED"
                      ? "Confirmado en caja"
                      : "Pendiente de cobro"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {hasDelivery ? (
                    <SelectItem value="PENDING">Pendiente de cobro</SelectItem>
                  ) : null}
                  <SelectItem value="CONFIRMED">Confirmado en caja</SelectItem>
                </SelectContent>
              </Select>
              {formState.status === "CONFIRMED" && !currentCashSession ? (
                <p className="text-xs text-muted-foreground">
                  Se validará la caja abierta antes de confirmar.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label>Importe</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.amount}
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  amount: event.target.value,
                }));
                setFieldError(null);
              }}
              disabled={saving}
              placeholder="0.00"
            />
          </div>

          <div className="grid gap-2">
            <Label>Referencia</Label>
            <Input
              value={formState.reference}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  reference: event.target.value,
                }))
              }
              disabled={saving}
              placeholder="Nro. operación, comprobante o referencia"
            />
          </div>

          <div className="grid gap-2">
            <Label>Observación</Label>
            <Textarea
              value={formState.observation}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  observation: event.target.value,
                }))
              }
              disabled={saving}
              maxLength={255}
              placeholder="Detalle opcional"
            />
          </div>

          {saleCancelled ? (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              La venta está anulada. Los pagos quedan solo lectura.
            </p>
          ) : null}

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
            disabled={saving}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || cashSessionLoading || saleCancelled}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {saving || cashSessionLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Guardar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
