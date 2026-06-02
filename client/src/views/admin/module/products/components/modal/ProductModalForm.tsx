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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { productFormSchema } from "../../validations/products.validations";
import type {
  FieldError,
  ProductFormValues,
  ProductResponse,
} from "../../types/products.types";
import type { ProductCategoryResponse } from "../../../product-categories/types/productCategories.types";

type SubmitResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

type Props = {
  isOpen: boolean;
  dataEdit: ProductResponse | null;
  categories: ProductCategoryResponse[];
  loadingCategories: boolean;
  backendErrors: FieldError[];
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<SubmitResult>;
};

const initialForm: ProductFormValues = {
  idProductCategory: "",
  barcode: "",
  name: "",
  description: "",
  imageUrl: "",
  priceCost: "",
  priceSale: "",
  stock: "0",
  stockMin: "0",
};

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

export const ProductModalForm = ({
  isOpen,
  dataEdit,
  categories,
  backendErrors,
  onClose,
  onSubmit,
}: Props) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<ProductFormValues>(initialForm);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const selectedCategory = categories.find(
    (category) =>
      String(category.idProductCategory) === formSate.idProductCategory,
  );
  const selectedCategoryLabel = selectedCategory?.name?.trim() || undefined;

  useEffect(() => {
    if (dataEdit) {
      setFormSate({
        idProductCategory: String(dataEdit.idProductCategory),
        barcode: dataEdit.barcode ?? "",
        name: dataEdit.name,
        description: dataEdit.description ?? "",
        imageUrl: dataEdit.imageUrl ?? "",
        priceCost: String(dataEdit.priceCost),
        priceSale: String(dataEdit.priceSale),
        stock: String(dataEdit.stock),
        stockMin: String(dataEdit.stockMin),
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
    const validation = productFormSchema.safeParse(formSate);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {dataEdit ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="balance">
              Categorias <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formSate.idProductCategory}
              onValueChange={(value) =>
                setFormSate({ ...formSate, idProductCategory: value })
              }
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Seleccione una opcion">
                  {selectedCategoryLabel ?? "Seleccione una opcion"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  <SelectGroup>
                    {categories.map((el) => (
                      <SelectItem
                        key={el.idProductCategory}
                        value={String(el.idProductCategory)}
                      >
                        {el.name?.trim() || "Sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <SelectGroup>
                    <SelectLabel>Sin datos</SelectLabel>
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>

            {errors.idProductCategory && (
              <p className="text-sm text-destructive">
                {errors.idProductCategory}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="barcode">Código de barras</Label>
            <Input
              id="barcode"
              name="barcode"
              value={formSate.barcode}
              onChange={onInputChange}
              placeholder="Ej: 7791234567890"
            />
            {errors.barcode && (
              <p className="text-sm text-destructive">{errors.barcode}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={formSate.name}
              onChange={onInputChange}
              placeholder="Ej: Coca Cola 500ml"
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
              placeholder="Descripción del producto..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="imageUrl">URL de imagen</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formSate.imageUrl}
              onChange={onInputChange}
              placeholder="https://..."
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">{errors.imageUrl}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="priceCost">Precio costo</Label>
              <Input
                id="priceCost"
                name="priceCost"
                type="number"
                min="0"
                step="0.01"
                value={formSate.priceCost}
                onChange={onInputChange}
                placeholder="0.00"
              />
              {errors.priceCost && (
                <p className="text-sm text-destructive">{errors.priceCost}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priceSale">Precio venta</Label>
              <Input
                id="priceSale"
                name="priceSale"
                type="number"
                min="0"
                step="0.01"
                value={formSate.priceSale}
                onChange={onInputChange}
                placeholder="0.00"
              />
              {errors.priceSale && (
                <p className="text-sm text-destructive">{errors.priceSale}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock actual</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formSate.stock}
                onChange={onInputChange}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stockMin">Stock mínimo</Label>
              <Input
                id="stockMin"
                name="stockMin"
                type="number"
                min="0"
                step="1"
                value={formSate.stockMin}
                onChange={onInputChange}
                placeholder="0"
              />
              {errors.stockMin && (
                <p className="text-sm text-destructive">{errors.stockMin}</p>
              )}
            </div>
          </div>

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
