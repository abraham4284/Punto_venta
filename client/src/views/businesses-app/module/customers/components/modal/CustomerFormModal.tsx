import { useEffect, useState } from "react";
import { customerFormSchema } from "../../validations/customer.validation";
import type { Customer, CustomerFormValues } from "../../types/customers.types";
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
import { Textarea } from "@/components/ui/textarea";

interface Props {
  isOpen: boolean;
  customerEdit: Customer | null;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
}

const initialForm: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  observation: "",
};

export const CustomerFormModal = ({
  isOpen,
  customerEdit,
  onClose,
  onSubmit,
}: Props) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<CustomerFormValues>(initialForm);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customerEdit) {
      setFormSate({
        name: customerEdit.name ?? "",
        phone: customerEdit.phone ?? "",
        email: customerEdit.email ?? "",
        address: customerEdit.address ?? "",
        observation: customerEdit.observation ?? "",
      });
    } else {
      onResetForm();
    }

    setErrors({});
  }, [customerEdit, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = customerFormSchema.safeParse(formSate);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};

      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      await onSubmit(validation.data as CustomerFormValues);
      onResetForm();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {customerEdit ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={formSate.name}
              onChange={onInputChange}
              placeholder="Ej: Juan Pérez"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type= "number"
              value={formSate.phone}
              onChange={onInputChange}
              placeholder="Ej: 3815555555"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formSate.email}
              onChange={onInputChange}
              placeholder="Ej: cliente@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              value={formSate.address}
              onChange={onInputChange}
              placeholder="Ej: San Martín 123"
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observation">Observación</Label>
            <Textarea
              id="observation"
              name="observation"
              value={formSate.observation}
              onChange={onInputChange}
              placeholder="Información adicional del cliente..."
            />
            {errors.observation && (
              <p className="text-sm text-destructive">
                {errors.observation}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : customerEdit ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};