import { Plus, Trash2, WalletCards } from "lucide-react";
import Decimal from "decimal.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { PaymentMethodResponse } from "../../../payment-methods/types";
import { paymentMethodTypeLabels } from "../../../payment-methods/helpers/payment-method.helpers";
import type { SalePaymentInput } from "../../types";
import { formatSaleMoney, getFieldError } from "../../helpers/createSale.helpers";

type PaymentTotals = {
  total: number;
  assigned: number;
  pending: number;
  isBalanced: boolean;
};

type Props = {
  payments: SalePaymentInput[];
  paymentMethods: PaymentMethodResponse[];
  paymentMethodsLoading: boolean;
  totals: PaymentTotals;
  hasDelivery: boolean;
  disabled: boolean;
  errors: Record<string, string>;
  onAddPayment: () => void;
  onRemovePayment: (id: string) => void;
  onPaymentChange: <K extends keyof SalePaymentInput>(
    id: string,
    field: K,
    value: SalePaymentInput[K],
  ) => void;
};

const getPaymentMethodLabel = (
  idPaymentMethod: number | null,
  paymentMethods: PaymentMethodResponse[],
): string => {
  const selectedPaymentMethod = paymentMethods.find((paymentMethod) => {
    return paymentMethod.idPaymentMethod === idPaymentMethod;
  });

  if (!selectedPaymentMethod) return "Método sin seleccionar";

  return `${selectedPaymentMethod.name} · ${paymentMethodTypeLabels[selectedPaymentMethod.code]}`;
};

const getPaymentStatusLabel = (status: SalePaymentInput["status"]): string => {
  return status === "CONFIRMED" ? "Confirmado" : "Pendiente";
};

const getPaymentSummary = (
  payments: SalePaymentInput[],
  paymentMethods: PaymentMethodResponse[],
): string => {
  const selectedPayments = payments.filter((payment) => payment.idPaymentMethod);

  if (selectedPayments.length === 0) return "Sin método de pago";
  if (selectedPayments.length === 1) {
    return getPaymentMethodLabel(
      selectedPayments[0].idPaymentMethod,
      paymentMethods,
    );
  }

  return `${selectedPayments.length} medios configurados`;
};

const toMoney = (value: Decimal.Value): number => {
  return Number(new Decimal(value).toDecimalPlaces(2).toString());
};

const getAssignedExcludingPayment = (
  payments: SalePaymentInput[],
  paymentId: string,
): number => {
  return toMoney(
    payments.reduce((acc, payment) => {
      if (payment.id === paymentId) return acc;

      const amount = Number(payment.amount);
      return Number.isFinite(amount) ? acc.plus(amount) : acc;
    }, new Decimal(0)),
  );
};

export const SalePaymentsSection = ({
  payments,
  paymentMethods,
  paymentMethodsLoading,
  totals,
  hasDelivery,
  disabled,
  errors,
  onAddPayment,
  onRemovePayment,
  onPaymentChange,
}: Props) => {
  const pendingPaymentsTotal = payments.reduce((acc, payment) => {
    if (payment.status !== "PENDING") return acc;

    const amount = Number(payment.amount);
    return acc + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const overpaidAmount = Math.max(totals.assigned - totals.total, 0);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Pago</h2>
              <p className="text-sm text-muted-foreground">
                {getPaymentSummary(payments, paymentMethods)}
              </p>
            </div>
          </div>

          <Badge
            className={
              totals.isBalanced
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
            }
          >
            {totals.isBalanced ? "Completo" : "Falta asignar"}
          </Badge>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Asignado</span>
            <span className="font-semibold">{formatSaleMoney(totals.assigned)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Diferencia</span>
            <span
              className={
                overpaidAmount > 0
                  ? "font-semibold text-destructive"
                  : "font-semibold"
              }
            >
              {overpaidAmount > 0
                ? `Te pasaste ${formatSaleMoney(overpaidAmount)}`
                : formatSaleMoney(totals.pending)}
            </span>
          </div>
          {overpaidAmount > 0 ? (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
              El importe asignado supera el total. Ajustá uno de los pagos para
              poder registrar la venta.
            </div>
          ) : null}
          {hasDelivery && pendingPaymentsTotal > 0 && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
              {formatSaleMoney(pendingPaymentsTotal)} pendiente de cobro.
            </div>
          )}
        </div>

        {(getFieldError(errors, "payments") ||
          getFieldError(errors, "idPaymentMethod")) && (
          <p className="text-sm text-destructive">
            {getFieldError(errors, "payments") ||
              getFieldError(errors, "idPaymentMethod")}
          </p>
        )}

        <Dialog>
          <DialogTrigger
            render={
              <Button type="button" variant="outline" className="w-full" />
            }
          >
            Configurar pagos
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Configurar pagos</DialogTitle>
              <DialogDescription>
                Distribuí el total entre uno o varios métodos. Los pagos
                pendientes solo se permiten si la venta tiene entrega.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total venta</p>
                  <p className="text-lg font-bold">
                    {formatSaleMoney(totals.total)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Asignado</p>
                  <p className="text-lg font-bold">
                    {formatSaleMoney(totals.assigned)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {overpaidAmount > 0 ? "Excedente" : "Falta asignar"}
                  </p>
                  <p
                    className={
                      overpaidAmount > 0
                        ? "break-words text-lg font-bold text-destructive"
                        : "break-words text-lg font-bold text-emerald-700"
                    }
                  >
                    {overpaidAmount > 0
                      ? formatSaleMoney(overpaidAmount)
                      : formatSaleMoney(totals.pending)}
                  </p>
                </div>
              </div>

              {payments.map((payment, index) => {
                const selectedPaymentMethod = paymentMethods.find((method) => {
                  return method.idPaymentMethod === payment.idPaymentMethod;
                });
                const assignedWithoutCurrent = getAssignedExcludingPayment(
                  payments,
                  payment.id,
                );
                const rowRemaining = Math.max(
                  totals.total - assignedWithoutCurrent,
                  0,
                );
                const selectedPaymentMethodHint = selectedPaymentMethod?.affectsCash
                  ? "Impacta caja al confirmarse o rendirse."
                  : "No impacta caja directamente.";

                return (
                  <div
                    key={payment.id}
                    className="grid gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-[minmax(0,1fr)_150px_170px_auto]"
                  >
                    <div className="grid gap-2">
                      <Label>
                        {index === 0 ? "Medio principal" : "Medio adicional"}
                      </Label>
                      <Select
                        value={
                          payment.idPaymentMethod
                            ? String(payment.idPaymentMethod)
                            : ""
                        }
                        onValueChange={(value: string | null) => {
                          onPaymentChange(
                            payment.id,
                            "idPaymentMethod",
                            value ? Number(value) : null,
                          );
                        }}
                        disabled={
                          disabled ||
                          paymentMethodsLoading ||
                          paymentMethods.length === 0
                        }
                      >
                        <SelectTrigger className="w-full">
                          <span
                            className={
                              payment.idPaymentMethod
                                ? "flex flex-1 text-left"
                                : "flex flex-1 text-left text-muted-foreground"
                            }
                          >
                            {getPaymentMethodLabel(
                              payment.idPaymentMethod,
                              paymentMethods,
                            )}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((paymentMethod) => (
                            <SelectItem
                              key={paymentMethod.idPaymentMethod}
                              value={String(paymentMethod.idPaymentMethod)}
                            >
                              {paymentMethod.name} ·{" "}
                              {paymentMethodTypeLabels[paymentMethod.code]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label>Importe</Label>
                        {rowRemaining > 0 ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                            disabled={disabled}
                            onClick={() =>
                              onPaymentChange(
                                payment.id,
                                "amount",
                                String(toMoney(rowRemaining)),
                              )
                            }
                          >
                            Usar diferencia
                          </button>
                        ) : null}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.amount}
                        onChange={(event) =>
                          onPaymentChange(
                            payment.id,
                            "amount",
                            event.target.value.replace(",", "."),
                          )
                        }
                        placeholder={index === 0 ? formatSaleMoney(totals.total) : "0.00"}
                        disabled={disabled}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Estado</Label>
                      <Select
                        value={hasDelivery ? payment.status : "CONFIRMED"}
                        onValueChange={(value: string | null) => {
                          if (value === "PENDING" || value === "CONFIRMED") {
                            onPaymentChange(payment.id, "status", value);
                          }
                        }}
                        disabled={disabled || !hasDelivery}
                      >
                        <SelectTrigger className="w-full">
                          <span className="flex flex-1 text-left">
                            {hasDelivery
                              ? getPaymentStatusLabel(payment.status)
                              : "Confirmado"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                          <SelectItem value="PENDING">Pendiente</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {hasDelivery
                          ? selectedPaymentMethodHint
                          : "Sin entrega se confirma automáticamente."}
                      </p>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={payments.length === 1 || disabled}
                        onClick={() => onRemovePayment(payment.id)}
                        aria-label="Quitar medio de pago"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 lg:col-span-4 lg:grid-cols-2">
                      <Input
                        value={payment.reference}
                        onChange={(event) =>
                          onPaymentChange(
                            payment.id,
                            "reference",
                            event.target.value,
                          )
                        }
                        placeholder="Referencia opcional"
                        disabled={disabled}
                      />
                      <Input
                        value={payment.observation}
                        onChange={(event) =>
                          onPaymentChange(
                            payment.id,
                            "observation",
                            event.target.value,
                          )
                        }
                        placeholder="Observación opcional"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onAddPayment}
                disabled={disabled || paymentMethods.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar otro medio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
