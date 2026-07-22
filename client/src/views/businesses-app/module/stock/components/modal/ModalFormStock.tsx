import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { AxiosError } from "axios";
import { Search } from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_UNIT_TYPE_OPTIONS,
  type ProductResponse,
  type ProductUnitType,
} from "../../../products/types/products.types";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import { createInitialStockRequest } from "../../api/stock.api";
import {
  processStockAdjustmentRequest,
  processStockTransferRequest,
} from "../../api/stock.movement.api";
import type {
  ApiErrorResponse,
  FieldError,
  StockFormValues,
  StockOperationType,
} from "../../types/stock.types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  products: ProductResponse[];
  deposits: DepositResponse[];
  onSuccess?: () => void | Promise<void>;
};

type OperationOption = {
  value: StockOperationType;
  label: string;
};

const operationOptions: OperationOption[] = [
  { value: "INITIAL_STOCK", label: "Alta de stock" },
  { value: "ADJUSTMENT_IN", label: "Ingreso por ajuste" },
  { value: "ADJUSTMENT_OUT", label: "Egreso por ajuste" },
  { value: "TRANSFER", label: "Transferencia entre depositos" },
];

const initialForm: StockFormValues = {
  idProduct: "",
  operationType: "",
  idDeposit: "",
  idDepositFrom: "",
  idDepositTo: "",
  quantity: "",
  observation: "",
};

const mapErrorsToRecord = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

const getUnitOption = (unitType: ProductUnitType) => {
  return PRODUCT_UNIT_TYPE_OPTIONS.find((option) => {
    return option.value === unitType;
  });
};

const isQuantityAllowedForUnit = (
  quantity: number,
  unitType: ProductUnitType,
): boolean => {
  if (unitType !== "UNIT") return true;
  return Number.isInteger(quantity);
};

export const ModalFormStock = ({
  isOpen,
  onClose,
  products,
  deposits,
  onSuccess,
}: Props) => {
  const { formSate, onInputChange, setFormSate, onResetForm } =
    useForm<StockFormValues>(initialForm);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  const selectedProduct = products.find(
    (product) => String(product.idProduct) === formSate.idProduct,
  );
  const selectedDeposit = deposits.find(
    (deposit) => String(deposit.idDeposit) === formSate.idDeposit,
  );
  const selectedDepositFrom = deposits.find(
    (deposit) => String(deposit.idDeposit) === formSate.idDepositFrom,
  );
  const selectedDepositTo = deposits.find(
    (deposit) => String(deposit.idDeposit) === formSate.idDepositTo,
  );
  const selectedOperation = operationOptions.find(
    (operation) => operation.value === formSate.operationType,
  );
  const selectedUnitType = selectedProduct?.unitType ?? "UNIT";
  const selectedUnitOption = getUnitOption(selectedUnitType);
  const quantityStep = selectedUnitType === "UNIT" ? "1" : "0.01";
  const quantityMin = selectedUnitType === "UNIT" ? "1" : "0.01";
  const quantityPlaceholder =
    selectedUnitType === "UNIT"
      ? "Ej: 5"
      : `Ej: 10.5 ${selectedUnitOption?.shortLabel ?? ""}`.trim();
  const isTransfer = formSate.operationType === "TRANSFER";
  const isAdjustment =
    formSate.operationType === "ADJUSTMENT_IN" ||
    formSate.operationType === "ADJUSTMENT_OUT";
  const usesSingleDeposit =
    formSate.operationType === "INITIAL_STOCK" || isAdjustment;
  const depositEqualityError =
    isTransfer &&
    formSate.idDepositFrom &&
    formSate.idDepositTo &&
    formSate.idDepositFrom === formSate.idDepositTo
      ? "El deposito origen y destino deben ser distintos"
      : "";
  const filteredProducts = useMemo(() => {
    const value = productSearch.trim().toLowerCase();

    if (!value) {
      return products.slice(0, 8);
    }

    return products
      .filter((product) => {
        const name = product.name.toLowerCase();
        const barcode = product.barcode?.toLowerCase() ?? "";

        return name.includes(value) || barcode.includes(value);
      })
      .slice(0, 8);
  }, [productSearch, products]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onResetForm();
      setErrors({});
      setProductSearch("");
      setIsProductSearchOpen(false);
      onClose();
    }
  };

  const handleProductSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setProductSearch(value);
    setIsProductSearchOpen(true);

    if (formSate.idProduct) {
      setFormSate({ ...formSate, idProduct: "" });
    }
  };

  const handleProductSelect = (product: ProductResponse) => {
    setFormSate({ ...formSate, idProduct: String(product.idProduct) });
    setProductSearch(product.name);
    setIsProductSearchOpen(false);
    setErrors((currentErrors) => {
      const restErrors = { ...currentErrors };
      delete restErrors.idProduct;
      return restErrors;
    });
  };

  const handleOperationChange = (value: string | null) => {
    if (!value) return;

    const operationType = value as StockOperationType;

    setFormSate({
      ...formSate,
      operationType,
      idDeposit: "",
      idDepositFrom: "",
      idDepositTo: "",
    });
    setErrors({});
  };

  const handleDepositChange = (value: string | null) => {
    if (!value) return;

    setFormSate({ ...formSate, idDeposit: value });
  };

  const handleDepositFromChange = (value: string | null) => {
    if (!value) return;

    setFormSate({ ...formSate, idDepositFrom: value });
  };

  const handleDepositToChange = (value: string | null) => {
    if (!value) return;

    setFormSate({ ...formSate, idDepositTo: value });
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const quantity = Number(formSate.quantity);

    if (!formSate.idProduct) {
      nextErrors.idProduct = "Selecciona un producto";
    }

    if (!formSate.operationType) {
      nextErrors.operationType = "Selecciona una operacion";
    }

    if (usesSingleDeposit && !formSate.idDeposit) {
      nextErrors.idDeposit = "Selecciona un deposito";
    }

    if (isTransfer && !formSate.idDepositFrom) {
      nextErrors.idDepositFrom = "Selecciona el deposito de origen";
    }

    if (isTransfer && !formSate.idDepositTo) {
      nextErrors.idDepositTo = "Selecciona el deposito de destino";
    }

    if (depositEqualityError) {
      nextErrors.idDepositTo = depositEqualityError;
    }

    if (!formSate.quantity || Number.isNaN(quantity) || quantity <= 0) {
      nextErrors.quantity = "La cantidad debe ser mayor a cero";
    }

    if (
      formSate.quantity &&
      !Number.isNaN(quantity) &&
      !isQuantityAllowedForUnit(quantity, selectedUnitType)
    ) {
      nextErrors.quantity =
        "Los productos por unidad solo permiten cantidades enteras";
    }

    if (formSate.observation.length > 255) {
      nextErrors.observation = "La observacion no puede superar los 255 caracteres";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleApiError = (error: unknown) => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const backendErrors = axiosError.response?.data?.errors ?? [];

    if (backendErrors.length > 0) {
      setErrors(mapErrorsToRecord(backendErrors));
      return;
    }

    setErrors({
      form:
        axiosError.response?.data?.message ||
        "No se pudo procesar la operacion de stock",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const quantity = Number(formSate.quantity);
      const observation = formSate.observation.trim() || null;

      if (formSate.operationType === "INITIAL_STOCK") {
        await createInitialStockRequest({
          idProduct: Number(formSate.idProduct),
          idDeposit: Number(formSate.idDeposit),
          quantity,
          observation,
        });
      }

      if (
        formSate.operationType === "ADJUSTMENT_IN" ||
        formSate.operationType === "ADJUSTMENT_OUT"
      ) {
        await processStockAdjustmentRequest({
          idProduct: Number(formSate.idProduct),
          idDeposit: Number(formSate.idDeposit),
          quantity,
          type: formSate.operationType,
          observation,
        });
      }

      if (formSate.operationType === "TRANSFER") {
        await processStockTransferRequest({
          idProduct: Number(formSate.idProduct),
          idDepositFrom: Number(formSate.idDepositFrom),
          idDepositTo: Number(formSate.idDepositTo),
          quantity,
          observation,
        });
      }

      await onSuccess?.();
      onResetForm();
      setProductSearch("");
      setIsProductSearchOpen(false);
      onClose();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestionar stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {errors.form && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          )}

          <div className="grid gap-2">
            <Label>
              Producto <span className="text-red-500">*</span>
            </Label>
            <div
              className="relative"
              onBlur={() => {
                window.setTimeout(() => setIsProductSearchOpen(false), 120);
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={handleProductSearchChange}
                  onFocus={() => setIsProductSearchOpen(true)}
                  placeholder="Buscar por nombre o codigo de barras"
                  className="pl-9"
                />
              </div>

              {isProductSearchOpen && (
                <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-md border bg-popover p-2 text-popover-foreground shadow-lg">
                  {filteredProducts.length > 0 ? (
                    <div className="grid gap-1">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.idProduct}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleProductSelect(product)}
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-12 w-12 rounded-md border object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                              Sin img
                            </div>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {product.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              Codigo: {product.barcode || "Sin codigo"}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              Precio venta: ${product.priceSale}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-2 py-3 text-sm text-muted-foreground">
                      No se encontraron productos
                    </p>
                  )}
                </div>
              )}
            </div>
            {errors.idProduct && (
              <p className="text-sm text-destructive">{errors.idProduct}</p>
            )}
          </div>

          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedProduct.name}</CardTitle>
                <CardDescription>
                  Codigo: {selectedProduct.barcode || "Sin codigo"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    Sin img
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Precio venta: ${selectedProduct.priceSale}</p>
                  <p>
                    Stock minimo: {selectedProduct.stockMin}{" "}
                    {selectedUnitOption?.shortLabel ?? "u."}
                  </p>
                  <p>Tipo: {selectedUnitOption?.label ?? "Unidad"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-2">
            <Label>
              Tipo de operacion <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formSate.operationType}
              onValueChange={handleOperationChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una operacion">
                  {selectedOperation?.label ?? "Selecciona una operacion"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {operationOptions.map((operation) => (
                    <SelectItem key={operation.value} value={operation.value}>
                      {operation.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.operationType && (
              <p className="text-sm text-destructive">{errors.operationType}</p>
            )}
          </div>

          {usesSingleDeposit && (
            <div className="grid gap-2">
              <Label>
                Deposito <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formSate.idDeposit}
                onValueChange={handleDepositChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un deposito">
                    {selectedDeposit?.name ?? "Selecciona un deposito"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {deposits.map((deposit) => (
                      <SelectItem
                        key={deposit.idDeposit}
                        value={String(deposit.idDeposit)}
                      >
                        {deposit.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.idDeposit && (
                <p className="text-sm text-destructive">{errors.idDeposit}</p>
              )}
            </div>
          )}

          {isTransfer && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>
                  Deposito origen <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formSate.idDepositFrom}
                  onValueChange={handleDepositFromChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona origen">
                      {selectedDepositFrom?.name ?? "Selecciona origen"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {deposits.map((deposit) => (
                        <SelectItem
                          key={deposit.idDeposit}
                          value={String(deposit.idDeposit)}
                        >
                          {deposit.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.idDepositFrom && (
                  <p className="text-sm text-destructive">
                    {errors.idDepositFrom}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>
                  Deposito destino <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formSate.idDepositTo}
                  onValueChange={handleDepositToChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona destino">
                      {selectedDepositTo?.name ?? "Selecciona destino"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {deposits.map((deposit) => (
                        <SelectItem
                          key={deposit.idDeposit}
                          value={String(deposit.idDeposit)}
                        >
                          {deposit.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {(errors.idDepositTo || depositEqualityError) && (
                  <p className="text-sm text-destructive">
                    {errors.idDepositTo || depositEqualityError}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="quantity">
              Cantidad{" "}
              {selectedUnitOption ? `(${selectedUnitOption.shortLabel})` : ""}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={quantityMin}
              step={quantityStep}
              value={formSate.quantity}
              onChange={onInputChange}
              placeholder={quantityPlaceholder}
            />
            <p className="text-xs text-muted-foreground">
              {selectedUnitType === "UNIT"
                ? "Este producto se maneja por unidad, por eso no acepta decimales."
                : "Este producto permite cantidades decimales."}
            </p>
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observation">Observacion</Label>
            <Textarea
              id="observation"
              name="observation"
              value={formSate.observation}
              onChange={onInputChange}
              placeholder="Detalle opcional del movimiento"
            />
            {errors.observation && (
              <p className="text-sm text-destructive">{errors.observation}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onResetForm();
                setErrors({});
                setProductSearch("");
                setIsProductSearchOpen(false);
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
