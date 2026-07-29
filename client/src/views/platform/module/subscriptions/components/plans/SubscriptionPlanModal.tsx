import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@/hooks/useForm";
import { subscriptionPlanSchema } from "../../validations/subscriptions.validations";
import type {
  FieldError,
  SubscriptionPlan,
  SubscriptionPlanFormValues,
} from "../../types/subscriptions.types";

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataEdit: SubscriptionPlan | null;
  fieldErrors: FieldError[];
  isSaving: boolean;
  onCreate: (values: SubscriptionPlanFormValues) => Promise<{ success: boolean }>;
  onUpdate: (
    idSubscriptionPlan: number,
    values: SubscriptionPlanFormValues,
  ) => Promise<{ success: boolean }>;
  onClearErrors: () => void;
}

const initialForm: SubscriptionPlanFormValues = {
  code: "",
  name: "",
  description: "",
  billingPeriod: "MONTHLY",
  price: "0",
  currency: "ARS",
  trialDays: "0",
  maxUsers: "",
  maxProducts: "",
  maxDeposits: "",
  unlimitedUsers: true,
  unlimitedProducts: true,
  unlimitedDeposits: true,
  isActive: true,
};

const getInitialFormFromPlan = (plan: SubscriptionPlan): SubscriptionPlanFormValues => {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description || "",
    billingPeriod: plan.billingPeriod,
    price: new Decimal(plan.price || 0).toFixed(2),
    currency: plan.currency,
    trialDays: String(plan.trialDays),
    maxUsers: plan.maxUsers === null ? "" : String(plan.maxUsers),
    maxProducts: plan.maxProducts === null ? "" : String(plan.maxProducts),
    maxDeposits: plan.maxDeposits === null ? "" : String(plan.maxDeposits),
    unlimitedUsers: plan.maxUsers === null,
    unlimitedProducts: plan.maxProducts === null,
    unlimitedDeposits: plan.maxDeposits === null,
    isActive: plan.isActive,
  };
};

const mapServerErrors = (errors: FieldError[]) => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const SubscriptionPlanModal = ({
  isOpen,
  onClose,
  dataEdit,
  fieldErrors,
  isSaving,
  onCreate,
  onUpdate,
  onClearErrors,
}: SubscriptionPlanModalProps) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<SubscriptionPlanFormValues>(initialForm);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const errors = useMemo(
    () => ({ ...localErrors, ...mapServerErrors(fieldErrors) }),
    [fieldErrors, localErrors],
  );

  useEffect(() => {
    if (!isOpen) return;
    setLocalErrors({});
    onClearErrors();
    setFormSate(dataEdit ? getInitialFormFromPlan(dataEdit) : initialForm);
  }, [dataEdit, isOpen, onClearErrors, setFormSate]);

  const handleClose = () => {
    setLocalErrors({});
    onClearErrors();
    onResetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const parsed = subscriptionPlanSchema.safeParse(formSate);

    if (!parsed.success) {
      const nextErrors = parsed.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        },
        {},
      );
      setLocalErrors(nextErrors);
      return;
    }

    const result = dataEdit
      ? await onUpdate(dataEdit.idSubscriptionPlan, formSate)
      : await onCreate(formSate);

    if (result.success) handleClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dataEdit ? "Editar plan" : "Nuevo plan"}</DialogTitle>
          <DialogDescription>
            Configura limites, precio y periodo comercial del plan SaaS.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Codigo</Label>
            <Input
              name="code"
              value={formSate.code}
              onChange={onInputChange}
              disabled={Boolean(dataEdit)}
              placeholder="BASIC_MONTHLY"
            />
            {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
          </div>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              name="name"
              value={formSate.name}
              onChange={onInputChange}
              placeholder="Plan Basico"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Periodo</Label>
            <Select
              value={formSate.billingPeriod}
              onValueChange={(value) => {
                if (!value) return;
                setFormSate({
                  ...formSate,
                  billingPeriod: value as SubscriptionPlanFormValues["billingPeriod"],
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="MONTHLY">Mensual</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[1fr_88px] gap-2">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formSate.price}
                onChange={onInputChange}
              />
              {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Input
                name="currency"
                value={formSate.currency}
                onChange={onInputChange}
              />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Descripcion</Label>
            <Textarea
              name="description"
              value={formSate.description}
              onChange={onInputChange}
              placeholder="Detalle comercial del plan"
            />
          </div>
          <div className="space-y-2">
            <Label>Dias de prueba</Label>
            <Input
              name="trialDays"
              type="number"
              min="0"
              value={formSate.trialDays}
              onChange={onInputChange}
            />
          </div>
          {[
            ["Usuarios", "maxUsers", "unlimitedUsers"],
            ["Productos", "maxProducts", "unlimitedProducts"],
            ["Depositos", "maxDeposits", "unlimitedDeposits"],
          ].map(([label, field, unlimitedField]) => (
            <div key={field} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>{label}</Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  Ilimitado
                  <Switch
                    checked={Boolean(formSate[unlimitedField as keyof SubscriptionPlanFormValues])}
                    onCheckedChange={(checked) =>
                      setFormSate({
                        ...formSate,
                        [unlimitedField]: checked,
                        [field]: checked ? "" : formSate[field as keyof SubscriptionPlanFormValues],
                      })
                    }
                  />
                </div>
              </div>
              <Input
                name={field}
                type="number"
                min="1"
                disabled={Boolean(formSate[unlimitedField as keyof SubscriptionPlanFormValues])}
                value={String(formSate[field as keyof SubscriptionPlanFormValues])}
                onChange={onInputChange}
              />
              {errors[field] && (
                <p className="text-sm text-red-600">{errors[field]}</p>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <p className="font-medium">Plan activo</p>
              <p className="text-sm text-muted-foreground">
                Permite asignarlo a nuevos negocios.
              </p>
            </div>
            <Switch
              checked={formSate.isActive}
              onCheckedChange={(checked) =>
                setFormSate({ ...formSate, isActive: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? "Guardando..." : dataEdit ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
