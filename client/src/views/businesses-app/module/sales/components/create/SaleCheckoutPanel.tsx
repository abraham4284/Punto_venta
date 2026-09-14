import { Loader2, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatSaleMoney } from "../../helpers/createSale.helpers";

type SaleTotals = {
  subtotal: number;
  discountTotal: number;
  total: number;
};

type PaymentTotals = {
  assigned: number;
  pending: number;
  isBalanced: boolean;
};

type Props = {
  totals: SaleTotals;
  paymentTotals: PaymentTotals;
  observation: string;
  error: string | null;
  saving: boolean;
  disabled: boolean;
  disabledReason: string | null;
  isSaleCompleted: boolean;
  onObservationChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export const SaleCheckoutPanel = ({
  totals,
  paymentTotals,
  observation,
  error,
  saving,
  disabled,
  disabledReason,
  isSaleCompleted,
  onObservationChange,
  onSubmit,
  onReset,
}: Props) => {
  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Checkout</h2>
              <p className="text-sm text-muted-foreground">
                Revisión final antes de registrar.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-muted/30 p-4">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatSaleMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Descuentos</span>
              <span className="font-medium">
                {formatSaleMoney(totals.discountTotal)}
              </span>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold tracking-tight">
                {formatSaleMoney(totals.total)}
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Pago asignado</span>
              <span className="font-semibold">
                {formatSaleMoney(paymentTotals.assigned)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Diferencia</span>
              <span className="font-semibold">
                {formatSaleMoney(paymentTotals.pending)}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Observación</Label>
            <Textarea
              value={observation}
              onChange={(event) => onObservationChange(event.target.value)}
              placeholder="Detalle opcional de la venta"
              disabled={isSaleCompleted}
              className="min-h-24"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {disabledReason && !saving && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {disabledReason}
            </p>
          )}

          <div className="grid gap-2">
            <Button
              type="button"
              size="lg"
              disabled={disabled}
              onClick={onSubmit}
              className="h-12"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando venta...
                </>
              ) : (
                "Registrar venta"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onReset}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};
