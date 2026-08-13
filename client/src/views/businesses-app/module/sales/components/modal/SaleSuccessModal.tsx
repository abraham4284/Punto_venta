import { useState } from "react";
import { CheckCircle, FileText, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getSaleTicketRequest } from "../../api/sales.api";
import { printTicketHtml } from "../../helpers/ticketPrint.helper";

type Props = {
  isOpen: boolean;
  idSale: number | null;
  saleNumber: string | null;
  onResetForm: () => void;
  onViewDetails: (idSale: number) => void;
};

export const SaleSuccessModal = ({
  isOpen,
  idSale,
  saleNumber,
  onResetForm,
  onViewDetails,
}: Props) => {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrintTicket = async () => {
    if (!idSale) return;

    try {
      setPrinting(true);
      setError(null);

      const response = await getSaleTicketRequest(idSale);
      const opened = printTicketHtml(response.data.data.htmlTemplate);

      if (!opened) {
        setError("El navegador bloqueo la ventana de impresion.");
        return;
      }
    } catch {
      setError("No se pudo generar el ticket de la venta.");
    } finally {
      setPrinting(false);
    }
  };

  const handleViewDetails = () => {
    if (!idSale) return;
    onViewDetails(idSale);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle className="h-9 w-9" />
          </div>
          <DialogTitle className="text-xl">
            ¡Venta Registrada con Exito!
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Operacion {saleNumber ?? "-"} procesada correctamente.
          </p>
        </DialogHeader>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid gap-3">
          <Button
            type="button"
            disabled={!idSale || printing}
            onClick={handlePrintTicket}
            className="w-full"
          >
            {printing ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Imprimir / Descargar Ticket
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!idSale || printing}
            onClick={handleViewDetails}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            Ver Detalle de Venta
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={printing}
            onClick={onResetForm}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Nueva Venta / Volver
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
