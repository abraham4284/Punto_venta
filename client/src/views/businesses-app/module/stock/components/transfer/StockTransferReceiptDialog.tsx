import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { StockTransferReceiptData } from "../../helpers/stock-transfer-receipt.helper";
import { StockTransferPrintDocument } from "./StockTransferPrintDocument";
import { StockTransferReceiptContent } from "./StockTransferReceiptContent";

interface Props {
  receipt: StockTransferReceiptData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryRefreshFailed?: boolean;
  showTrigger?: boolean;
}

export const StockTransferReceiptDialog = ({ receipt, open, onOpenChange, inventoryRefreshFailed, showTrigger = true }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {showTrigger && (
      <DialogTrigger render={<Button type="button" variant="ghost" />}>Último comprobante</DialogTrigger>
    )}
    <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Comprobante de transferencia</DialogTitle>
        <DialogDescription>Transferencia confirmada. Podés imprimir el comprobante o guardarlo como PDF.</DialogDescription>
        {inventoryRefreshFailed && (
          <p role="status" className="text-sm text-muted-foreground">
            La transferencia se realizó, pero no se pudo actualizar el inventario.
          </p>
        )}
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto rounded-lg border">
        <StockTransferReceiptContent receipt={receipt} />
      </div>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cerrar</DialogClose>
        <Button type="button" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="size-4" /> Imprimir / Guardar PDF
        </Button>
      </DialogFooter>
    </DialogContent>
    {open && <StockTransferPrintDocument receipt={receipt} />}
  </Dialog>
);
