import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
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

import {
  productCreateFormSchema,
  productUpdateFormSchema,
} from "../../validations/products.validations";
import type {
  FieldError,
  ProductFormValues,
  ProductResponse,
  ProductUnitType,
} from "../../types/products.types";
import {
  PRODUCT_UNIT_TYPE_OPTIONS,
  PRODUCT_UNIT_TYPES,
} from "../../types/products.types";
import type { ProductCategoryResponse } from "../../../product-categories/types/productCategories.types";
import type { DepositResponse } from "../../../deposits/types/deposits.types";

type SubmitResult = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};

type Props = {
  isOpen: boolean;
  dataEdit: ProductResponse | null;
  categories: ProductCategoryResponse[];
  deposits: DepositResponse[];
  loadingCategories: boolean;
  backendErrors: FieldError[];
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<SubmitResult>;
};

const initialForm: ProductFormValues = {
  idProductCategory: "",
  idDeposit: "",
  barcode: "",
  name: "",
  description: "",
  imageUrl: "",
  priceCost: "",
  priceSale: "",
  unitType: "UNIT",
  stock: "0",
  stockMin: "0",
};

const isProductUnitType = (
  value: string | null | undefined,
): value is ProductUnitType => {
  return PRODUCT_UNIT_TYPES.some((unitType) => unitType === value);
};

const getUnitOption = (unitType: ProductUnitType) => {
  return PRODUCT_UNIT_TYPE_OPTIONS.find((option) => option.value === unitType);
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
  deposits,
  backendErrors,
  onClose,
  onSubmit,
}: Props) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<ProductFormValues>(initialForm);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const categoryValue = formSate.idProductCategory ?? "";
  const depositValue = formSate.idDeposit ?? "";
  const selectedCategory = categories.find(
    (category) => String(category.idProductCategory) === categoryValue,
  );
  const selectedCategoryLabel = selectedCategory?.name?.trim() || undefined;
  const selectedDeposit = deposits.find(
    (deposit) => String(deposit.idDeposit) === depositValue,
  );
  const selectedDepositLabel = selectedDeposit?.name?.trim() || undefined;
  const selectedUnitType = getUnitOption(formSate.unitType);
  const stockStep = formSate.unitType === "UNIT" ? "1" : "0.01";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (dataEdit) {
        setFormSate({
          idProductCategory: String(dataEdit.idProductCategory),
          idDeposit: "",
          barcode: dataEdit.barcode ?? "",
          name: dataEdit.name,
          description: dataEdit.description ?? "",
          imageUrl: dataEdit.imageUrl ?? "",
          priceCost: String(dataEdit.priceCost),
          priceSale: String(dataEdit.priceSale),
          unitType: dataEdit.unitType ?? "UNIT",
          stock: String(dataEdit.stock),
          stockMin: String(dataEdit.stockMin),
        });
      } else {
        setFormSate(initialForm);
      }

      setErrors({});
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [dataEdit, isOpen, setFormSate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (backendErrors.length > 0) {
        setErrors(mapErrorsToRecord(backendErrors));
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [backendErrors]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrors({});
      onClose();
    }
  };

  const clearFieldError = (field: keyof ProductFormValues) => {
    if (!errors[field]) return;

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onInputChange(event);
    clearFieldError(event.target.name as keyof ProductFormValues);
  };

  const handleSelectChange = (
    field: keyof ProductFormValues,
    value: string | null,
  ) => {
    setFormSate({ ...formSate, [field]: value ?? "" });
    clearFieldError(field);
  };

  const handleUnitTypeChange = (value: string | null) => {
    if (!isProductUnitType(value)) {
      return;
    }

    setFormSate({ ...formSate, unitType: value });
    clearFieldError("unitType");
  };

  const handleBarcodeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();
    nameInputRef.current?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = dataEdit
      ? productUpdateFormSchema.safeParse(formSate)
      : productCreateFormSchema.safeParse(formSate);

    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce<
        Record<string, string>
      >((acc, issue) => {
        const field = issue.path[0];

        if (typeof field === "string" && !acc[field]) {
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

      const result = await onSubmit(formSate);

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
              value={categoryValue}
              onValueChange={(value) =>
                handleSelectChange("idProductCategory", value)
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
              onChange={handleInputChange}
              onKeyDown={handleBarcodeKeyDown}
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
              ref={nameInputRef}
              value={formSate.name}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                placeholder="0.00"
              />
              {errors.priceSale && (
                <p className="text-sm text-destructive">{errors.priceSale}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unitType">
              Tipo de unidad <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formSate.unitType}
              onValueChange={handleUnitTypeChange}
            >
              <SelectTrigger id="unitType" className="w-full">
                <SelectValue placeholder="Seleccione una unidad">
                  {selectedUnitType?.label ?? "Seleccione una unidad"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PRODUCT_UNIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.unitType && (
              <p className="text-sm text-destructive">{errors.unitType}</p>
            )}
          </div>

          {!dataEdit && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock actual</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step={stockStep}
                    value={formSate.stock}
                    onChange={handleInputChange}
                    placeholder={
                      formSate.unitType === "UNIT" ? "0" : "0.00"
                    }
                  />
                  {errors.stock && (
                    <p className="text-sm text-destructive">{errors.stock}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="balance">
                    Depositos <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={depositValue}
                    onValueChange={(value) =>
                      handleSelectChange("idDeposit", value)
                    }
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Seleccione una opcion">
                        {selectedDepositLabel ?? "Seleccione una opcion"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {deposits.length > 0 ? (
                        <SelectGroup>
                          {deposits.map((el) => (
                            <SelectItem
                              key={el.idDeposit}
                              value={String(el.idDeposit)}
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

                  {errors.idDeposit && (
                    <p className="text-sm text-destructive">
                      {errors.idDeposit}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="stockMin">Stock mínimo</Label>
            <Input
              id="stockMin"
              name="stockMin"
              type="number"
              min="0"
              step={stockStep}
              value={formSate.stockMin}
              onChange={handleInputChange}
              placeholder={formSate.unitType === "UNIT" ? "0" : "0.00"}
            />
            {errors.stockMin && (
              <p className="text-sm text-destructive">{errors.stockMin}</p>
            )}
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
