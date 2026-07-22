import { PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductResponse } from "../../../products/types/products.types";

type Props = {
  product: ProductResponse;
  onAdd: (product: ProductResponse) => void;
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const getUnitLabel = (unitType: ProductResponse["unitType"]): string => {
  const labels: Record<ProductResponse["unitType"], string> = {
    UNIT: "Unidad",
    KG: "Kg",
    GRAM: "Gramo",
    LITER: "Litro",
    METER: "Metro",
  };

  return labels[unitType] ?? "Unidad";
};

export const ProductPurchaseCard = ({ product, onAdd }: Props) => {
  return (
    <Card className="overflow-hidden transition hover:border-primary/40 hover:shadow-sm">
      <CardContent className="grid gap-3 p-3">
        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-semibold">{product.name}</h3>
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Codigo: {product.barcode || "Sin codigo"}
          </p>
          <p className="text-xs text-muted-foreground">
            Tipo: {getUnitLabel(product.unitType)}
          </p>
          <p className="text-sm font-semibold">
            Costo actual: {formatMoney(product.priceCost)}
          </p>
        </div>

        <Button
          type="button"
          disabled={!product.isActive}
          onClick={() => onAdd(product)}
        >
          <PackagePlus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </CardContent>
    </Card>
  );
};
