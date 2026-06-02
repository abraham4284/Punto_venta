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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { productCategoryFormSchema } from "../../validations/productCategory.validation"
import type {
  FieldError,
  ProductCategoryFormValues,
  ProductCategoryResponse,
} from "../../types/productCategories.types";

type Props = {
  isOpen: boolean;
  dataEdit: ProductCategoryResponse | null;
  backendErrors: FieldError[];
  onClose: () => void;
  onSubmit: (
    values: ProductCategoryFormValues,
  ) => Promise<{ status: boolean; message: string; errors?: FieldError[] }>;
};

const initialForm: ProductCategoryFormValues = {
  name: "",
  description: "",
  isDefault: false,
};

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const CategoryModalForm = ({
  isOpen,
  dataEdit,
  backendErrors,
  onClose,
  onSubmit,
}: Props) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<ProductCategoryFormValues>(initialForm);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dataEdit) {
      setFormSate({
        name: dataEdit.name,
        description: dataEdit.description ?? "",
        isDefault: dataEdit.isDefault,
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrors({});
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = productCategoryFormSchema.safeParse(formSate);

    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce<
        Record<string, string>
      >((acc, issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          acc[field] = issue.message;
        }

        return acc;
      }, {});

      setErrors(fieldErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const result = await onSubmit(validation.data);

      if (!result.status && result.errors) {
        setErrors(mapErrorsToRecord(result.errors));
        return;
      }

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
            {dataEdit ? "Editar categoría" : "Nueva categoría"}
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
              placeholder="Ej: Bebidas"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formSate.description}
              onChange={onInputChange}
              placeholder="Ej: Categoría para productos bebibles"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <Label htmlFor="isDefault">Categoría por defecto</Label>
              <p className="text-sm text-muted-foreground">
                Se utilizará como categoría predeterminada cuando corresponda.
              </p>
            </div>

            <Switch
              id="isDefault"
              checked={formSate.isDefault}
              onCheckedChange={(checked) => {
                setFormSate({
                  ...formSate,
                  isDefault: checked,
                });
              }}
            />
          </div>

          {errors.isDefault && (
            <p className="text-sm text-destructive">{errors.isDefault}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrors({});
                onClose();
              }}
            >
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