import { useEffect, useState, type FormEvent } from "react";
import { useForm } from "@/hooks/useForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  SelectValue,
} from "@/components/ui/select";
import { customPaymentMethodTypeOptions } from "../helpers/payment-method.helpers";
import type {
  FieldError,
  MutationResult,
  PaymentMethodFormValues,
  PaymentMethodResponse,
} from "../types";
import { paymentMethodFormSchema } from "../validations/payment-methods.validations";

interface PaymentMethodModalProps {
  isOpen: boolean;
  dataEdit: PaymentMethodResponse | null;
  backendErrors: FieldError[];
  onClose: () => void;
  onSubmit: (values: PaymentMethodFormValues) => Promise<MutationResult>;
}

const initialForm: PaymentMethodFormValues = {
  code: "TRANSFER",
  name: "",
};

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const PaymentMethodModal = ({
  isOpen,
  dataEdit,
  backendErrors,
  onClose,
  onSubmit,
}: PaymentMethodModalProps) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<PaymentMethodFormValues>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(dataEdit);

  useEffect(() => {
    if (!isOpen) return;

    if (dataEdit && dataEdit.code !== "CASH") {
      setFormSate({
        code: dataEdit.code,
        name: dataEdit.name,
      });
    } else {
      onResetForm();
    }

    setErrors({});
  }, [dataEdit, isOpen]);

  useEffect(() => {
    if (backendErrors.length > 0) {
      setErrors(mapErrorsToRecord(backendErrors));
    }
  }, [backendErrors]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = paymentMethodFormSchema.safeParse(formSate);

    if (!parsed.success) {
      setErrors(
        parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];

          if (typeof field === "string") {
            acc[field] = issue.message;
          }

          return acc;
        }, {}),
      );
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const result = await onSubmit(parsed.data);

      if (!result.status && result.errors) {
        setErrors(mapErrorsToRecord(result.errors));
        return;
      }

      onResetForm();
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar metodo de pago" : "Nuevo metodo de pago"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={formSate.code}
              disabled={isEditing}
              onValueChange={(value: string | null) => {
                if (!value) return;

                setFormSate({
                  ...formSate,
                  code: value as PaymentMethodFormValues["code"],
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {customPaymentMethodTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nombre visible</Label>
            <Input
              id="name"
              name="name"
              value={formSate.name}
              onChange={onInputChange}
              placeholder="Ej: Mercado Pago"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
