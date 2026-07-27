import { useEffect, useMemo, useState } from "react";
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
import { supplierFormSchema } from "../../validations/suppliers.validations";
import type {
  FieldError,
  SupplierFormValues,
  SupplierResponse,
} from "../../types";

type Props = {
  isOpen: boolean;
  dataEdit: SupplierResponse | null;
  saving: boolean;
  fieldErrors: FieldError[];
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<boolean>;
};

const initialForm: SupplierFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  observation: "",
};

export const SupplierModal = ({
  isOpen,
  dataEdit,
  saving,
  fieldErrors,
  onClose,
  onSubmit,
}: Props) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<SupplierFormValues>(initialForm);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const backendErrors = useMemo(() => {
    return fieldErrors.reduce<Record<string, string>>((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});
  }, [fieldErrors]);

  const errors = {
    ...backendErrors,
    ...localErrors,
  };

  useEffect(() => {
    if (!isOpen) return;

    if (dataEdit) {
      setFormSate({
        name: dataEdit.name ?? "",
        phone: dataEdit.phone ?? "",
        email: dataEdit.email ?? "",
        address: dataEdit.address ?? "",
        observation: dataEdit.observation ?? "",
      });
    } else {
      setFormSate(initialForm);
    }
  }, [dataEdit, isOpen, setFormSate]);

  const handleClose = () => {
    onResetForm();
    setLocalErrors({});
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = supplierFormSchema.safeParse(formSate);

    if (!validation.success) {
      const nextErrors = validation.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const field = issue.path[0];

          if (typeof field === "string") {
            acc[field] = issue.message;
          }

          return acc;
        },
        {},
      );

      setLocalErrors(nextErrors);
      return;
    }

    setLocalErrors({});
    const success = await onSubmit(validation.data as SupplierFormValues);

    if (success) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {dataEdit ? "Editar proveedor" : "Nuevo proveedor"}
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
              placeholder="Ej: Hongos del Valle"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              name="phone"
              value={formSate.phone}
              onChange={onInputChange}
              placeholder="Ej: 3815555555"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electronico</Label>
            <Input
              id="email"
              name="email"
              value={formSate.email}
              onChange={onInputChange}
              placeholder="Ej: proveedor@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              name="address"
              value={formSate.address}
              onChange={onInputChange}
              placeholder="Ej: Av. Central 123"
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observation">Observacion</Label>
            <Textarea
              id="observation"
              name="observation"
              value={formSate.observation}
              onChange={onInputChange}
              placeholder="Informacion adicional del proveedor..."
            />
            {errors.observation && (
              <p className="text-sm text-destructive">{errors.observation}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : dataEdit ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
