import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import { Package, ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import type { SupplierResponse } from "../../../suppliers/types";
import type {
  CreatePurchasePayload,
  FieldError,
  PurchaseCartItem,
} from "../../types";

type Props = {
  isOpen: boolean;
  cart: PurchaseCartItem[];
  suppliers: SupplierResponse[];
  saving: boolean;
  fieldErrors: FieldError[];
  onClose: () => void;
  onRemove: (idProduct: number, idDeposit: number) => void;
  onSubmit: (payload: CreatePurchasePayload) => Promise<boolean>;
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const toDecimal = (value: string | number): Decimal => {
  const normalized = String(value || "0").replace(",", ".");
  return new Decimal(normalized || 0);
};

const roundMoney = (value: Decimal): number => {
  return Number(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
};

const normalizeNumber = (value: string): number => {
  return Number(value.replace(",", "."));
};

const getFieldError = (
  errors: FieldError[],
  field: string,
): string | undefined => {
  return errors.find((error) => error.field === field)?.message;
};

export const PurchaseCartModal = ({
  isOpen,
  cart,
  suppliers,
  saving,
  fieldErrors,
  onClose,
  onRemove,
  onSubmit,
}: Props) => {
  const [idSupplier, setIdSupplier] = useState<string>("none");
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState("0");
  const [observation, setObservation] = useState("");

  const activeSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => supplier.isActive);
  }, [suppliers]);

  const subtotal = useMemo(() => {
    return roundMoney(
      cart.reduce((acc, item) => {
        return acc.plus(toDecimal(item.quantity).mul(item.unitPrice));
      }, new Decimal(0)),
    );
  }, [cart]);

  const itemDiscountTotal = useMemo(() => {
    return roundMoney(
      cart.reduce((acc, item) => {
        return acc.plus(item.discountAmount);
      }, new Decimal(0)),
    );
  }, [cart]);

  const globalDiscountAmount = useMemo(() => {
    const discountPercent = toDecimal(globalDiscountPercent);
    const base = toDecimal(subtotal).minus(itemDiscountTotal);

    if (base.lte(0) || discountPercent.lte(0)) return 0;

    return roundMoney(base.mul(discountPercent).div(100));
  }, [globalDiscountPercent, itemDiscountTotal, subtotal]);

  const total = useMemo(() => {
    return Math.max(subtotal - itemDiscountTotal - globalDiscountAmount, 0);
  }, [globalDiscountAmount, itemDiscountTotal, subtotal]);

  const selectedSupplierName = useMemo(() => {
    if (idSupplier === "none") return "Sin proveedor / ingreso directo";

    const selected = activeSuppliers.find((supplier) => {
      return String(supplier.idSupplier) === idSupplier;
    });

    return selected?.name ?? "";
  }, [activeSuppliers, idSupplier]);

  const handleClose = () => {
    setIdSupplier("none");
    setGlobalDiscountPercent("0");
    setObservation("");
    onClose();
  };

  const buildPayload = (): CreatePurchasePayload | null => {
    if (cart.length === 0) {
      toast.error("Agrega productos al carrito antes de registrar la compra");
      return null;
    }

    const discountPercent = normalizeNumber(globalDiscountPercent || "0");

    if (!Number.isFinite(discountPercent) || discountPercent < 0) {
      toast.error("El descuento general no puede ser negativo");
      return null;
    }

    if (discountPercent > 100) {
      toast.error("El descuento general no puede superar el 100%");
      return null;
    }

    const details = cart.map((item, index) => {
      const gross = toDecimal(item.quantity).mul(item.unitPrice);
      const itemBase = Decimal.max(gross.minus(item.discountAmount), 0);
      const baseAfterItemDiscounts = Decimal.max(
        toDecimal(subtotal).minus(itemDiscountTotal),
        0,
      );
      const previousGlobalDiscount = cart.slice(0, index).reduce((acc, detail) => {
        const detailGross = toDecimal(detail.quantity).mul(detail.unitPrice);
        const detailBase = Decimal.max(detailGross.minus(detail.discountAmount), 0);

        if (baseAfterItemDiscounts.lte(0)) return acc;

        return acc.plus(
          detailBase.mul(globalDiscountAmount).div(baseAfterItemDiscounts),
        );
      }, new Decimal(0));
      const currentGlobalDiscount =
        baseAfterItemDiscounts.lte(0)
          ? new Decimal(0)
          : index === cart.length - 1
            ? toDecimal(globalDiscountAmount).minus(previousGlobalDiscount)
            : itemBase.mul(globalDiscountAmount).div(baseAfterItemDiscounts);
      const discountAmount = roundMoney(
        toDecimal(item.discountAmount).plus(currentGlobalDiscount),
      );

      return {
        idProduct: item.idProduct,
        idDeposit: item.idDeposit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount,
        subtotal: roundMoney(gross.minus(discountAmount)),
      };
    });

    const discountTotal = roundMoney(
      details.reduce((acc, item) => {
        return acc.plus(item.discountAmount);
      }, new Decimal(0)),
    );

    return {
      idSupplier: idSupplier === "none" ? null : Number(idSupplier),
      subtotal,
      discountTotal,
      total: Number((subtotal - discountTotal).toFixed(2)),
      observation: observation.trim() || null,
      details,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();

    if (!payload) return;

    const success = await onSubmit(payload);

    if (success) handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Confirmar compra</DialogTitle>
          <DialogDescription>
            Revisa los productos y completa los datos de la compra antes de
            registrarla.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Proveedor</Label>
              <Select
                value={idSupplier}
                onValueChange={(value) => {
                  if (value !== null) setIdSupplier(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <span
                    className={
                      selectedSupplierName ? "" : "text-muted-foreground"
                    }
                  >
                    {selectedSupplierName || "Sin proveedor"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Sin proveedor / ingreso directo</SelectItem>
                    {activeSuppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.idSupplier}
                        value={String(supplier.idSupplier)}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {getFieldError(fieldErrors, "idSupplier") && (
                <p className="text-sm text-destructive">
                  {getFieldError(fieldErrors, "idSupplier")}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Descuento general (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={globalDiscountPercent}
                onChange={(event) =>
                  setGlobalDiscountPercent(event.target.value)
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Observación</Label>
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="Detalle interno opcional de la compra"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="p-3 text-left">Producto</th>
                  <th className="p-3 text-left">Deposito</th>
                  <th className="p-3 text-right">Cantidad</th>
                  <th className="p-3 text-right">Costo</th>
                  <th className="p-3 text-right">Descuento</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Todavia no agregaste productos
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr
                      key={`${item.idProduct}-${item.idDeposit}`}
                      className="border-t"
                    >
                      <td className="p-3">
                        <div className="flex min-w-52 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </td>
                      <td className="p-3">{item.depositName}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="p-3 text-right">
                        {formatMoney(item.discountAmount)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatMoney(item.subtotal)}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onRemove(item.idProduct, item.idDeposit)
                          }
                        >
                          Quitar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ml-auto grid w-full max-w-sm gap-2 rounded-lg bg-muted/40 p-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Descuento productos</span>
              <strong>-{formatMoney(itemDiscountTotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Descuento general ({globalDiscountPercent || "0"}%)</span>
              <strong>-{formatMoney(globalDiscountAmount)}</strong>
            </div>
            <div className="border-t pt-2" />
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Seguir cargando
          </Button>
          <Button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            {saving ? "Procesando compra..." : "Registrar compra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
