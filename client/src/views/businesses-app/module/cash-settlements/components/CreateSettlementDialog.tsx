import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { CashSessionResponse } from "../../cash/types";
import {
  formatSettlementMoney,
} from "../helpers/cash-settlement.helpers";
import type { PendingCashSettlementCollectorResponse } from "../types";

type CreateSettlementDialogProps = {
  isOpen: boolean;
  collector: PendingCashSettlementCollectorResponse | null;
  selectedCount: number;
  selectedTotal: number;
  observation: string;
  cashSession: CashSessionResponse | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const CreateSettlementDialog = ({
  isOpen,
  collector,
  selectedCount,
  selectedTotal,
  observation,
  cashSession,
  saving,
  onClose,
  onConfirm,
}: CreateSettlementDialogProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar rendición de efectivo</AlertDialogTitle>
          <AlertDialogDescription>
            Los pagos seleccionados pasarán de cobrado por cadete a confirmado y
            el efectivo se incorporará a la caja abierta.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Cadete</span>
            <span className="font-medium">{collector?.collectorUserName ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Pagos seleccionados</span>
            <span className="font-medium">{selectedCount}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Total seleccionado</span>
            <span className="font-bold">{formatSettlementMoney(selectedTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Caja receptora</span>
            <span className="text-right font-medium">
              {cashSession
                ? `${cashSession.cashRegisterName} · sesión #${cashSession.idCashSession}`
                : "-"}
            </span>
          </div>
          {observation.trim() ? (
            <div className="grid gap-1">
              <span className="text-muted-foreground">Observación</span>
              <span className="font-medium">{observation.trim()}</span>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving} onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <Button type="button" disabled={saving} onClick={onConfirm}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Rendir seleccionados
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
