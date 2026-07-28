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
import { useForm } from "@/hooks/useForm";
import { assignSubscriptionSchema } from "../../validations/subscriptions.validations";
import type {
  AssignSubscriptionBody,
  BusinessOption,
  FieldError,
  SubscriptionPlan,
} from "../../types/subscriptions.types";

interface AssignFormValues {
  idBusiness: string;
  idSubscriptionPlan: string;
  startMode: "TRIAL" | "ACTIVE";
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface AssignSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: BusinessOption[];
  plans: SubscriptionPlan[];
  fieldErrors: FieldError[];
  isSaving: boolean;
  isLoadingBusinesses: boolean;
  onAssign: (body: AssignSubscriptionBody) => Promise<{ success: boolean }>;
  onClearErrors: () => void;
}

const initialForm: AssignFormValues = {
  idBusiness: "",
  idSubscriptionPlan: "",
  startMode: "TRIAL",
  currentPeriodStart: "",
  currentPeriodEnd: "",
};

const mapServerErrors = (errors: FieldError[]) => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

const getBusinessLabel = (business: BusinessOption) => {
  return `${business.name} (${business.slug})`;
};

export const AssignSubscriptionModal = ({
  isOpen,
  onClose,
  businesses,
  plans,
  fieldErrors,
  isSaving,
  isLoadingBusinesses,
  onAssign,
  onClearErrors,
}: AssignSubscriptionModalProps) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<AssignFormValues>(initialForm);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const errors = useMemo(
    () => ({ ...localErrors, ...mapServerErrors(fieldErrors) }),
    [fieldErrors, localErrors],
  );
  const selectedBusiness = useMemo(() => {
    return businesses.find(
      (business) => String(business.idBusiness) === formSate.idBusiness,
    );
  }, [businesses, formSate.idBusiness]);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(() => {
      setLocalErrors({});
      onClearErrors();
      setFormSate(initialForm);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onClearErrors, setFormSate]);

  const handleClose = () => {
    setLocalErrors({});
    onClearErrors();
    onResetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const parsed = assignSubscriptionSchema.safeParse(formSate);

    if (!parsed.success) {
      setLocalErrors(
        parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        }, {}),
      );
      return;
    }

    const result = await onAssign({
      idBusiness: Number(formSate.idBusiness),
      idSubscriptionPlan: Number(formSate.idSubscriptionPlan),
      startMode: formSate.startMode,
      currentPeriodStart: formSate.currentPeriodStart || null,
      currentPeriodEnd: formSate.currentPeriodEnd || null,
    });

    if (result.success) handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar suscripcion</DialogTitle>
          <DialogDescription>
            Vincula un negocio existente con un plan comercial activo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Negocio</Label>
            <Select
              value={formSate.idBusiness}
              disabled={isLoadingBusinesses || businesses.length === 0}
              onValueChange={(value) => {
                if (!value) return;
                setFormSate({ ...formSate, idBusiness: value });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingBusinesses
                      ? "Cargando negocios..."
                      : "Seleccione un negocio"
                  }
                >
                  {selectedBusiness ? getBusinessLabel(selectedBusiness) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {businesses.length > 0 ? (
                    businesses.map((business) => (
                      <SelectItem
                        key={business.idBusiness}
                        value={String(business.idBusiness)}
                      >
                        {getBusinessLabel(business)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      No hay negocios disponibles
                    </div>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.idBusiness && (
              <p className="text-sm text-red-600">{errors.idBusiness}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              value={formSate.idSubscriptionPlan}
              onValueChange={(value) => {
                if (!value) return;
                setFormSate({ ...formSate, idSubscriptionPlan: value });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {plans
                    .filter((plan) => plan.isActive)
                    .map((plan) => (
                      <SelectItem
                        key={plan.idSubscriptionPlan}
                        value={String(plan.idSubscriptionPlan)}
                      >
                        {plan.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.idSubscriptionPlan && (
              <p className="text-sm text-red-600">{errors.idSubscriptionPlan}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Modo de inicio</Label>
            <Select
              value={formSate.startMode}
              onValueChange={(value) => {
                if (!value) return;
                setFormSate({
                  ...formSate,
                  startMode: value as AssignFormValues["startMode"],
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="TRIAL">Prueba</SelectItem>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {formSate.startMode === "ACTIVE" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Inicio del periodo</Label>
                <Input
                  name="currentPeriodStart"
                  type="date"
                  value={formSate.currentPeriodStart}
                  onChange={onInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin del periodo</Label>
                <Input
                  name="currentPeriodEnd"
                  type="date"
                  value={formSate.currentPeriodEnd}
                  onChange={onInputChange}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSaving || isLoadingBusinesses}
            onClick={handleSubmit}
          >
            {isSaving ? "Asignando..." : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
