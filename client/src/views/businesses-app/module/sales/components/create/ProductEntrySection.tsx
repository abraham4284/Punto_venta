import { Plus, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { formatSaleMoney } from "../../helpers/createSale.helpers";
import { salePricingLabel, type getWholesalePricing, type WholesalePolicy } from "../../helpers/wholesale-pricing.helpers";
import type { Customer } from "../../../customers/types/customers.types";
import type { SalePricingType } from "../../types";

type Props = {
  barcode: string;
  pricingType: SalePricingType;
  pricing: ReturnType<typeof getWholesalePricing>;
  business: WholesalePolicy | null;
  customer: Customer | null;
  disabled: boolean;
  loadingProducts: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onBarcodeChange: (value: string) => void;
  onBarcodeSubmit: () => void;
  onOpenProductSearch: () => void;
};

export const ProductEntrySection = ({
  barcode,
  pricingType,
  pricing,
  business,
  customer,
  disabled,
  loadingProducts,
  inputRef,
  onBarcodeChange,
  onBarcodeSubmit,
  onOpenProductSearch,
}: Props) => {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="grid gap-4 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold">Productos</h2>
            <p className="text-sm text-muted-foreground">
              Escaneá el código o buscá por nombre para cargar el carrito.
            </p>
          </div>

          <Button
            type="button"
            disabled={disabled}
            onClick={onOpenProductSearch}
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Buscar productos
          </Button>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="barcode-sale">Código de barras</Label>
            <div className="relative">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="barcode-sale"
                ref={inputRef}
                value={barcode}
                disabled={disabled || loadingProducts}
                onChange={(event) => onBarcodeChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onBarcodeSubmit();
                  }
                }}
                placeholder={
                  disabled
                    ? "Abrí caja y seleccioná depósito para escanear"
                    : "Escaneá o ingresá el código..."
                }
                className="h-12 pl-9 text-base"
                autoFocus
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tipo de precio</Label>
            <div className="flex h-12 items-center rounded-md border bg-background px-3"><Badge variant={pricingType === "WHOLESALE" ? "default" : "secondary"}>{salePricingLabel(pricingType)}</Badge></div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={disabled || loadingProducts || !barcode.trim()}
            onClick={onBarcodeSubmit}
            className="h-12 w-full md:w-auto"
          >
            Agregar por código
          </Button>
        </div>
        <div aria-live="polite" className="space-y-1 rounded-lg border bg-background p-3 text-sm">
          {pricing.blockReason ? <p role="alert" className="text-destructive">{pricing.blockReason}</p>
            : !business?.wholesaleEnabled ? <p>Precios mayoristas desactivados. Precio minorista aplicado.</p>
            : !customer ? <p>Consumidor final · Precio minorista. Seleccioná un cliente para acceder a precios mayoristas.</p>
            : customer.pricingTier === "WHOLESALE" ? <p><strong>Cliente mayorista.</strong> Precios mayoristas aplicados, sin mínimo de compra.</p>
            : pricing.qualifiesForPromotion ? <p className="text-emerald-700"><strong>Esta venta califica como mayorista.</strong> Al completarla, el cliente quedará habilitado como mayorista.</p>
            : !pricing.allItemsHaveWholesalePrice ? <p>Precio minorista: hay productos sin precio mayorista. El carrito completo no puede calificar.</p>
            : <>
              <p>Compra mayorista mínima: <strong>{formatSaleMoney(business.wholesaleMinimumAmount ?? 0)}</strong></p>
              <p>Acumulado candidato: {formatSaleMoney(pricing.wholesaleCandidate)} · Faltan: <strong>{formatSaleMoney(pricing.amountRemaining ?? 0)}</strong></p>
            </>}
        </div>
      </CardContent>
    </Card>
  );
};
