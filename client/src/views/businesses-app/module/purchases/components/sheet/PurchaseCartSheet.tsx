import Decimal from "decimal.js";
import { Package, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PurchaseCartItem } from "../../types";

type PurchaseCartSheetProps = {
  isOpen: boolean;
  cart: PurchaseCartItem[];
  canContinue: boolean;
  continueLabel?: string;
  onClose: () => void;
  onContinue: () => void;
  onRemove: (idProduct: number, idDeposit: number) => void;
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const getSubtotal = (cart: PurchaseCartItem[]): number => {
  return Number(
    cart
      .reduce((acc, item) => {
        return acc.plus(item.subtotal);
      }, new Decimal(0))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toString(),
  );
};

export const PurchaseCartSheet = ({
  isOpen,
  cart,
  canContinue,
  continueLabel = "Continuar compra",
  onClose,
  onContinue,
  onRemove,
}: PurchaseCartSheetProps) => {
  const subtotal = getSubtotal(cart);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="gap-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito de compra
          </SheetTitle>
          <SheetDescription>
            {cart.length > 0
              ? `${cart.length} producto${cart.length === 1 ? "" : "s"} listo${cart.length === 1 ? "" : "s"} para revisar.`
              : "Tu carrito de compra esta vacio."}
          </SheetDescription>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <div className="mb-3 rounded-full bg-background p-3 shadow-sm">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Sin productos cargados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega productos desde Inventario o Nueva Compra para revisarlos
              aca antes de confirmar.
            </p>
          </div>
        ) : (
          <div className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1 pb-2">
            {cart.map((item) => (
              <article
                key={`${item.idProduct}-${item.idDeposit}`}
                className="rounded-xl border bg-card p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {item.productName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {item.depositName}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar ${item.productName} del carrito`}
                        onClick={() => onRemove(item.idProduct, item.idDeposit)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {item.quantity.toLocaleString("es-AR")} x{" "}
                        {formatMoney(item.unitPrice)}
                      </p>
                      <p className="font-semibold">
                        {formatMoney(item.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <SheetFooter>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal aproximado</span>
              <strong className="text-base">{formatMoney(subtotal)}</strong>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Seguir cargando
              </Button>
              <Button
                type="button"
                disabled={!canContinue || cart.length === 0}
                onClick={onContinue}
              >
                {continueLabel}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
