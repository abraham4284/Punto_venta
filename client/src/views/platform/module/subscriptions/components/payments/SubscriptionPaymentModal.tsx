import { useEffect, useMemo, useState } from "react";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@/hooks/useForm";
import { paymentSchema } from "../../validations/subscriptions.validations";
import type {
  BusinessSubscription,
  FieldError,
  SubscriptionPaymentFormValues,
} from "../../types/subscriptions.types";

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: BusinessSubscription[];
  selectedSubscription: BusinessSubscription | null;
  fieldErrors: FieldError[];
  isSaving: boolean;
  onCreate: (values: SubscriptionPaymentFormValues) => Promise<{ success: boolean }>;
  onClearErrors: () => void;
}

const initialForm: SubscriptionPaymentFormValues = {
  idBusinessSubscription: "",
  amount: "",
  currency: "ARS",
  paymentMethod: "TRANSFER",
  status: "APPROVED",
  paidAt: "",
  periodStart: "",
  periodEnd: "",
  externalReference: "",
  providerPaymentId: "",
  observation: "",
};

const mapServerErrors = (errors: FieldError[]) => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const SubscriptionPaymentModal = ({
  isOpen,
  onClose,
  subscriptions,
  selectedSubscription,
  fieldErrors,
  isSaving,
  onCreate,
  onClearErrors,
}: SubscriptionPaymentModalProps) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<SubscriptionPaymentFormValues>(initialForm);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const errors = useMemo(
    () => ({ ...localErrors, ...mapServerErrors(fieldErrors) }),
    [fieldErrors, localErrors],
  );

  useEffect(() => {
    if (!isOpen) return;
    setLocalErrors({});
    onClearErrors();
    setFormSate({
      ...initialForm,
      idBusinessSubscription: selectedSubscription
        ? String(selectedSubscription.idBusinessSubscription)
        : "",
      amount: selectedSubscription ? selectedSubscription.plan.price : "",
      currency: selectedSubscription?.plan.currency || "ARS",
      periodStart: selectedSubscription?.currentPeriodStart?.slice(0, 10) || "",
      periodEnd: selectedSubscription?.currentPeriodEnd?.slice(0, 10) || "",
    });
  }, [isOpen, onClearErrors, selectedSubscription, setFormSate]);

  const handleClose = () => {
    setLocalErrors({});
    onClearErrors();
    onResetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const parsed = paymentSchema.safeParse(formSate);

    if (!parsed.success) {
      setLocalErrors(
        parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        }, {}),
      );
      return;
    }

    const result = await onCreate(formSate);
    if (result.success) handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar pago de suscripcion</DialogTitle>
          <DialogDescription>
            Carga pagos manuales y vincula el periodo que queda cubierto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Suscripcion</Label>
            <Select
              value={formSate.idBusinessSubscription}
              onValueChange={(value) => {
                if (!value) return;
                const subscription = subscriptions.find(
                  (item) => item.idBusinessSubscription === Number(value),
                );
                setFormSate({
                  ...formSate,
                  idBusinessSubscription: value,
                  amount: subscription?.plan.price || formSate.amount,
                  currency: subscription?.plan.currency || formSate.currency,
                  periodStart:
                    subscription?.currentPeriodStart?.slice(0, 10) ||
                    formSate.periodStart,
                  periodEnd:
                    subscription?.currentPeriodEnd?.slice(0, 10) ||
                    formSate.periodEnd,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione una suscripcion" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {subscriptions.map((subscription) => (
                    <SelectItem
                      key={subscription.idBusinessSubscription}
                      value={String(subscription.idBusinessSubscription)}
                    >
                      {subscription.business.name} - {subscription.plan.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.idBusinessSubscription && (
              <p className="text-sm text-red-600">
                {errors.idBusinessSubscription}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Importe</Label>
            <Input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formSate.amount}
              onChange={onInputChange}
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
          </div>
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Input
              name="currency"
              value={formSate.currency}
              onChange={onInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Metodo</Label>
            <Select
              value={formSate.paymentMethod}
              onValueChange={(value) => {
                if (!value) return;
                setFormSate({
                  ...formSate,
                  paymentMethod: value as SubscriptionPaymentFormValues["paymentMethod"],
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={formSate.status}
              onValueChange={(value) => {
                if (!value) return;
                setFormSate({
                  ...formSate,
                  status: value as SubscriptionPaymentFormValues["status"],
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Periodo desde</Label>
            <Input
              name="periodStart"
              type="date"
              value={formSate.periodStart}
              onChange={onInputChange}
            />
            {errors.periodStart && (
              <p className="text-sm text-red-600">{errors.periodStart}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Periodo hasta</Label>
            <Input
              name="periodEnd"
              type="date"
              value={formSate.periodEnd}
              onChange={onInputChange}
            />
            {errors.periodEnd && (
              <p className="text-sm text-red-600">{errors.periodEnd}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Fecha de pago</Label>
            <Input
              name="paidAt"
              type="datetime-local"
              value={formSate.paidAt}
              onChange={onInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Referencia externa</Label>
            <Input
              name="externalReference"
              value={formSate.externalReference}
              onChange={onInputChange}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observacion</Label>
            <Textarea
              name="observation"
              value={formSate.observation}
              onChange={onInputChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? "Registrando..." : "Registrar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
