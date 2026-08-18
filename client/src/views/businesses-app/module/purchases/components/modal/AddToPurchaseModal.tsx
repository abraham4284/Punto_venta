import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import { PackagePlus } from "lucide-react";
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
} from "@/components/ui/select";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import type { ProductResponse } from "../../../products/types/products.types";
import type { PurchaseCartItem } from "../../types";

type FormState = {
  quantity: string;
  idDeposit: string;
  unitPrice: string;
  discountPercent: string;
};

type Props = {
  isOpen: boolean;
  product: ProductResponse | null;
  deposits: DepositResponse[];
  defaultDepositId?: number | null;
  defaultQuantity?: number | null;
  onClose: () => void;
  onConfirm: (item: PurchaseCartItem) => void;
};

const defaultFormState: FormState = {
  quantity: "1",
  idDeposit: "",
  unitPrice: "",
  discountPercent: "0",
};

const normalizeNumber = (value: string): number => {
  return Number(value.replace(",", "."));
};

const toDecimal = (value: string | number): Decimal => {
  const normalized = String(value || "0").replace(",", ".");
  return new Decimal(normalized || 0);
};

const roundMoney = (value: Decimal): number => {
  return Number(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
};

export const AddToPurchaseModal = ({
  isOpen,
  product,
  deposits,
  defaultDepositId = null,
  defaultQuantity = null,
  onClose,
  onConfirm,
}: Props) => {
  const activeDeposits = useMemo(() => {
    return deposits.filter((deposit) => deposit.isActive);
  }, [deposits]);
  const defaultDeposit = activeDeposits.find((deposit) => {
    if (defaultDepositId) return deposit.idDeposit === defaultDepositId;
    return deposit.isDefault;
  });

  return (
    <AddToPurchaseModalContent
      key={`${product?.idProduct ?? "none"}-${defaultDeposit?.idDeposit ?? "none"}-${defaultQuantity ?? "default"}-${isOpen ? "open" : "closed"}`}
      isOpen={isOpen}
      product={product}
      activeDeposits={activeDeposits}
      defaultDeposit={defaultDeposit}
      defaultQuantity={defaultQuantity}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};

type AddToPurchaseModalContentProps = {
  isOpen: boolean;
  product: ProductResponse | null;
  activeDeposits: DepositResponse[];
  defaultDeposit: DepositResponse | undefined;
  defaultQuantity: number | null;
  onClose: () => void;
  onConfirm: (item: PurchaseCartItem) => void;
};

const AddToPurchaseModalContent = ({
  isOpen,
  product,
  activeDeposits,
  defaultDeposit,
  defaultQuantity,
  onClose,
  onConfirm,
}: AddToPurchaseModalContentProps) => {
  const [formState, setFormState] = useState<FormState>(() => ({
    ...defaultFormState,
    quantity: defaultQuantity && defaultQuantity > 0 ? String(defaultQuantity) : "1",
    idDeposit: defaultDeposit ? String(defaultDeposit.idDeposit) : "",
    unitPrice: product ? String(product.priceCost || "") : "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedDepositName = useMemo(() => {
    const selected = activeDeposits.find((deposit) => {
      return String(deposit.idDeposit) === formState.idDeposit;
    });

    return selected?.name ?? "";
  }, [activeDeposits, formState.idDeposit]);

  const calculatedDiscountAmount = useMemo(() => {
    const quantity = toDecimal(formState.quantity);
    const unitPrice = toDecimal(formState.unitPrice);
    const discountPercent = toDecimal(formState.discountPercent);

    if (quantity.lte(0) || unitPrice.lte(0) || discountPercent.lte(0)) {
      return 0;
    }

    return roundMoney(
      quantity.mul(unitPrice).mul(discountPercent).div(100),
    );
  }, [formState.discountPercent, formState.quantity, formState.unitPrice]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleValueChange = (field: keyof FormState, value: string | null) => {
    if (value === null) return;
    setFormState((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = () => {
    if (!product) return;

    const quantity = normalizeNumber(formState.quantity);
    const idDeposit = Number(formState.idDeposit);
    const unitPrice = normalizeNumber(formState.unitPrice);
    const discountPercent = normalizeNumber(formState.discountPercent || "0");
    const nextErrors: Record<string, string> = {};
    const grossSubtotal = toDecimal(quantity).mul(unitPrice);
    const discountAmount = roundMoney(
      grossSubtotal.mul(discountPercent || 0).div(100),
    );

    if (!idDeposit) nextErrors.idDeposit = "Selecciona un deposito";
    if (!Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.quantity = "La cantidad debe ser mayor a cero";
    }
    if (product.unitType === "UNIT" && !Number.isInteger(quantity)) {
      nextErrors.quantity = "Los productos por unidad deben ser enteros";
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      nextErrors.unitPrice = "El costo unitario debe ser mayor a cero";
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 0) {
      nextErrors.discountPercent = "El descuento no puede ser negativo";
    }
    if (discountPercent > 100) {
      nextErrors.discountPercent = "El descuento no puede superar el 100%";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const deposit = activeDeposits.find((item) => item.idDeposit === idDeposit);
    const subtotal = roundMoney(grossSubtotal.minus(discountAmount));

    onConfirm({
      idProduct: product.idProduct,
      productName: product.name,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      idDeposit,
      depositName: deposit?.name ?? "Deposito",
      quantity,
      unitPrice,
      discountAmount,
      subtotal,
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar producto a la compra</DialogTitle>
          <DialogDescription>
            Define cantidad, deposito de ingreso y costo de reposicion.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="grid gap-4">
            <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  Codigo: {product.barcode || "Sin codigo"}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Deposito de ingreso</Label>
              <Select
                value={formState.idDeposit}
                onValueChange={(value) => handleValueChange("idDeposit", value)}
              >
                <SelectTrigger className="w-full">
                  <span className={selectedDepositName ? "" : "text-muted-foreground"}>
                    {selectedDepositName || "Selecciona un deposito"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {activeDeposits.map((deposit) => (
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={product.unitType === "UNIT" ? "1" : "0.001"}
                  step={product.unitType === "UNIT" ? "1" : "0.001"}
                  value={formState.quantity}
                  onChange={(event) =>
                    handleValueChange("quantity", event.target.value)
                  }
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">{errors.quantity}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Costo unitario</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.unitPrice}
                  onChange={(event) =>
                    handleValueChange("unitPrice", event.target.value)
                  }
                />
                {errors.unitPrice && (
                  <p className="text-sm text-destructive">{errors.unitPrice}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Descuento del item (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formState.discountPercent}
                onChange={(event) =>
                  handleValueChange("discountPercent", event.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Descuento calculado:{" "}
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 2,
                }).format(calculatedDiscountAmount)}
              </p>
              {errors.discountPercent && (
                <p className="text-sm text-destructive">
                  {errors.discountPercent}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
