import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/helpers";

type OperationTotalsProps = {
  subtotal: number;
  discountTotal: number;
  total: number;
};

export const OperationTotals = ({
  subtotal,
  discountTotal,
  total,
}: OperationTotalsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen económico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Descuento</span>
          <span className="font-medium text-destructive">
            -{formatCurrency(discountTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
