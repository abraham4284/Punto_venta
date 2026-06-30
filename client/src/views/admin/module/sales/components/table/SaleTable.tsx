import { useState } from "react";
import { Eye, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSaleTicketRequest } from "../../api/sales.api";
import { printTicketHtml } from "../../helpers/ticketPrint.helper";
import type { SaleResponse } from "../../types";

type Props = {
  sales: SaleResponse[];
  loading: boolean;
  onView: (idSale: number) => void;
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value: Date | string): string => {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const SaleTable = ({ sales, loading, onView }: Props) => {
  const [printingId, setPrintingId] = useState<number | null>(null);

  const handlePrintTicket = async (idSale: number) => {
    try {
      setPrintingId(idSale);

      const response = await getSaleTicketRequest(idSale);
      const opened = printTicketHtml(response.data.data.htmlTemplate);

      if (!opened) {
        window.alert("El navegador bloqueo la ventana de impresion.");
      }
    } catch {
      window.alert("No se pudo generar el ticket de la venta.");
    } finally {
      setPrintingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No hay ventas para los filtros seleccionados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N venta</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Deposito</TableHead>
          <TableHead>Total neto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.idSale}>
            <TableCell className="font-semibold">#{sale.idSale}</TableCell>
            <TableCell>{formatDate(sale.saleDate)}</TableCell>
            <TableCell>{sale.customerName ?? "Consumidor final"}</TableCell>
            <TableCell>{sale.depositName}</TableCell>
            <TableCell className="font-semibold">
              {formatMoney(sale.total)}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  sale.status === "COMPLETED"
                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                    : "border-red-200 bg-red-100 text-red-700"
                }
              >
                {sale.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={printingId !== null}
                  onClick={() => handlePrintTicket(sale.idSale)}
                  title="Imprimir ticket"
                  aria-label={`Imprimir ticket venta ${sale.idSale}`}
                >
                  {printingId === sale.idSale ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onView(sale.idSale)}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Ver detalle
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
