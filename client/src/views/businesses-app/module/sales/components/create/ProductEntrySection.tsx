import { Plus, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { RefObject } from "react";
import type { PriceType } from "../../types";

type Props = {
  barcode: string;
  priceType: PriceType;
  disabled: boolean;
  loadingProducts: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onBarcodeChange: (value: string) => void;
  onBarcodeSubmit: () => void;
  onOpenProductSearch: () => void;
  onPriceTypeChange: (value: PriceType) => void;
};

export const ProductEntrySection = ({
  barcode,
  priceType,
  disabled,
  loadingProducts,
  inputRef,
  onBarcodeChange,
  onBarcodeSubmit,
  onOpenProductSearch,
  onPriceTypeChange,
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
            <Select
              value={priceType}
              onValueChange={(value: string | null) => {
                if (value === "SALE" || value === "WHOLESALE") {
                  onPriceTypeChange(value);
                }
              }}
              disabled={disabled || loadingProducts}
            >
              <SelectTrigger className="h-12 w-full">
                <span className="flex flex-1 text-left">
                  {priceType === "SALE" ? "Precio de venta" : "Mayorista"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SALE">Precio de venta</SelectItem>
                <SelectItem value="WHOLESALE">Mayorista</SelectItem>
              </SelectContent>
            </Select>
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
      </CardContent>
    </Card>
  );
};
