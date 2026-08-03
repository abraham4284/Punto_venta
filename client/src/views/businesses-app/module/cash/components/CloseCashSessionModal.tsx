import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closeCashSessionFormSchema } from "../validations/cash.validations";
import type { CashLiveSummaryResponse, CloseCashSessionBody } from "../types";

interface CloseCashSessionModalProps {
  isOpen: boolean;
  summary: CashLiveSummaryResponse | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: CloseCashSessionBody) => Promise<boolean>;
}

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

const getDifferencePreview = (
  countedCashAmount: string,
  expectedCash: number,
): number => {
  try {
    return Number(new Decimal(countedCashAmount).minus(expectedCash).toFixed(2));
  } catch {
    return 0;
  }
};

export const CloseCashSessionModal = ({
  isOpen,
  summary,
  saving,
  onClose,
  onSubmit,
}: CloseCashSessionModalProps) => {
  const [countedCashAmount, setCountedCashAmount] = useState("");
  const [closingObservation, setClosingObservation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const differencePreview = useMemo(() => {
    if (!summary || !countedCashAmount) return 0;
    return getDifferencePreview(countedCashAmount, summary.expectedCash);
  }, [countedCashAmount, summary]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const parsed = closeCashSessionFormSchema.safeParse({
      countedCashAmount,
      closingObservation,
    });

    if (!parsed.success) {
      setErrors(
        parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          acc[issue.path.join(".")] = issue.message;
          return acc;
        }, {}),
      );
      return;
    }

    const saved = await onSubmit({
      countedCashAmount: parsed.data.countedCashAmount,
      closingObservation: parsed.data.closingObservation || null,
    });

    if (saved) {
      setCountedCashAmount("");
      setClosingObservation("");
      setErrors({});
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar caja</DialogTitle>
        </DialogHeader>
        {summary && (
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between"><span>Monto inicial</span><strong>{formatMoney(summary.openingAmount)}</strong></div>
            <div className="flex justify-between"><span>Ventas efectivo</span><strong>{formatMoney(summary.cashSales)}</strong></div>
            <div className="flex justify-between"><span>Ventas no efectivo</span><strong>{formatMoney(summary.nonCashSales)}</strong></div>
            <div className="flex justify-between"><span>Ingresos</span><strong>{formatMoney(summary.manualIncome)}</strong></div>
            <div className="flex justify-between"><span>Egresos</span><strong>{formatMoney(summary.manualExpense)}</strong></div>
            <div className="flex justify-between text-base"><span>Efectivo esperado</span><strong>{formatMoney(summary.expectedCash)}</strong></div>
          </div>
        )}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Efectivo contado</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={countedCashAmount}
              onChange={(event) => setCountedCashAmount(event.target.value)}
            />
            {errors.countedCashAmount && (
              <p className="text-sm text-destructive">{errors.countedCashAmount}</p>
            )}
          </div>
          <div className="rounded-lg border p-3 text-sm">
            Diferencia estimada: <strong>{formatMoney(differencePreview)}</strong>
          </div>
          <div className="grid gap-2">
            <Label>Observacion</Label>
            <Textarea
              value={closingObservation}
              onChange={(event) => setClosingObservation(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" disabled={saving} onClick={handleSubmit}>
            {saving ? "Cerrando..." : "Cerrar caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
