import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CartItem, ProductUnitType } from "../../types";
import { PRODUCT_UNIT_TYPE_OPTIONS } from "../../types";

type Props = {
  items: CartItem[];
  errors: Record<string, string>;
  onQuantityChange: (idProduct: number, quantity: number) => void;
  onDiscountPercentChange: (idProduct: number, value: number) => void;
  onRemove: (idProduct: number) => void;
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const getUnitOption = (unitType: ProductUnitType) => {
  return PRODUCT_UNIT_TYPE_OPTIONS.find((option) => {
    return option.value === unitType;
  });
};

const getQuantityStep = (unitType: ProductUnitType): string => {
  return unitType === "UNIT" ? "1" : "0.01";
};

const getQuantityMin = (unitType: ProductUnitType): string => {
  return unitType === "UNIT" ? "1" : "0.01";
};

export const CartTable = ({
  items,
  errors,
  onQuantityChange,
  onDiscountPercentChange,
  onRemove,
}: Props) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Descuento (%)</TableHead>
          <TableHead>Monto Descuento ($)</TableHead>
          <TableHead>Subtotal</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="h-20 text-center">
              Agrega productos al carrito
            </TableCell>
          </TableRow>
        ) : (
          items.map((item, index) => {
            const unitOption = getUnitOption(item.unitType);

            return (
              <TableRow key={item.idProduct}>
                <TableCell>
                  <div className="flex min-w-64 items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-12 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                        Sin img
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {item.stockQuantity}{" "}
                        {unitOption?.shortLabel ?? "u."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tipo: {unitOption?.label ?? "Unidad"}
                      </p>
                      {errors[`items.${index}.idProduct`] && (
                        <p className="text-xs text-destructive">
                          {errors[`items.${index}.idProduct`]}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-semibold">
                  {formatMoney(item.unitPrice)}
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    min={getQuantityMin(item.unitType)}
                    max={item.stockQuantity}
                    step={getQuantityStep(item.unitType)}
                    value={item.quantity}
                    onChange={(event) =>
                      onQuantityChange(
                        item.idProduct,
                        Number(event.target.value),
                      )
                    }
                    className="w-20 text-center"
                  />
                  {errors[`items.${index}.quantity`] && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors[`items.${index}.quantity`]}
                    </p>
                  )}
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discountPercent}
                    onChange={(event) =>
                      onDiscountPercentChange(
                        item.idProduct,
                        Number(event.target.value),
                      )
                    }
                    className="w-28 text-center"
                  />
                </TableCell>

                <TableCell>
                  <Input
                    value={formatMoney(item.discountAmount)}
                    readOnly
                    className="w-36 text-right"
                  />
                </TableCell>

                <TableCell>
                  <Input
                    value={formatMoney(item.total)}
                    readOnly
                    className="w-36 text-right"
                  />
                </TableCell>

                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRemove(item.idProduct)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Quitar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
