import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CartItem } from "../../types";
import { getFieldError, formatSaleMoney } from "../../helpers/createSale.helpers";
import { CartTable } from "../table/CartTable";

type Props = {
  items: CartItem[];
  errors: Record<string, string>;
  subtotal: number;
  discountPercent: number;
  discountTotal: number;
  onQuantityChange: (idProduct: number, quantity: number) => void;
  onDiscountPercentChange: (idProduct: number, value: number) => void;
  onRemove: (idProduct: number) => void;
  onGlobalDiscountPercentChange: (value: number) => void;
};

export const SaleCartSection = ({
  items,
  errors,
  subtotal,
  discountPercent,
  discountTotal,
  onQuantityChange,
  onDiscountPercentChange,
  onRemove,
  onGlobalDiscountPercentChange,
}: Props) => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Carrito</h2>
        <p className="text-sm text-muted-foreground">
          Revisá cantidades, descuentos por producto y stock disponible.
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <CartTable
            items={items}
            errors={errors}
            onQuantityChange={onQuantityChange}
            onDiscountPercentChange={onDiscountPercentChange}
            onRemove={onRemove}
          />
        </CardContent>
      </Card>

      {getFieldError(errors, "items") && (
        <p className="text-sm text-destructive">
          {getFieldError(errors, "items")}
        </p>
      )}

      <Card className="border-dashed">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Subtotal bruto</p>
            <p className="text-lg font-semibold">{formatSaleMoney(subtotal)}</p>
          </div>

          <div className="grid gap-2">
            <Label>Descuento global (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(event) =>
                onGlobalDiscountPercentChange(Number(event.target.value))
              }
              className="max-w-32"
            />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Descuento total</p>
            <p className="text-lg font-semibold">
              {formatSaleMoney(discountTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
