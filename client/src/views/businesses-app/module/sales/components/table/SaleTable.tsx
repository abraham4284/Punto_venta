import { useState } from "react";
import { Ban, Eye, Printer } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { getSaleTicketRequest } from "../../api/sales.api";
import { printTicketHtml } from "../../helpers/ticketPrint.helper";
import type { SaleResponse } from "../../types";

type Props = {
  sales: SaleResponse[];
  loading: boolean;
  cancelingId: number | null;
  onView: (idSale: number) => void;
  onCancel: (idSale: number) => Promise<void>;
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const deliveryStatusLabels: Record<NonNullable<SaleResponse["deliveryStatus"]>, string> = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregada",
  FAILED: "Fallida",
  CANCELLED: "Cancelada",
};

const deliveryStatusClassNames: Record<
  NonNullable<SaleResponse["deliveryStatus"]>,
  string
> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ASSIGNED: "border-sky-200 bg-sky-50 text-sky-700",
  OUT_FOR_DELIVERY: "border-violet-200 bg-violet-50 text-violet-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const paymentStatusLabels: Record<SaleResponse["paymentStatus"], string> = {
  UNPAID: "Pendiente",
  PARTIALLY_PAID: "Pago parcial",
  PAID: "Pagado",
};

const paymentStatusClassNames: Record<SaleResponse["paymentStatus"], string> = {
  UNPAID: "border-amber-200 bg-amber-50 text-amber-700",
  PARTIALLY_PAID: "border-sky-200 bg-sky-50 text-sky-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const saleStatusClassNames: Record<SaleResponse["status"], string> = {
  COMPLETED: "border-emerald-200 bg-emerald-100 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-100 text-red-700",
};

const getPaymentSummary = (sale: SaleResponse): string => {
  if (sale.paymentDetail?.trim()) return sale.paymentDetail;
  if (sale.paymentMethodName?.trim()) return sale.paymentMethodName;
  return "Sin detalle de pagos";
};

const getDeliveryLabel = (sale: SaleResponse): string => {
  if (!sale.deliveryStatus) return "Sin entrega";
  return deliveryStatusLabels[sale.deliveryStatus];
};

const getDeliveryClassName = (sale: SaleResponse): string => {
  if (!sale.deliveryStatus) return "border-slate-200 bg-slate-100 text-slate-600";
  return deliveryStatusClassNames[sale.deliveryStatus];
};

const SaleActions = ({
  sale,
  printingId,
  cancelingId,
  canCancelSales,
  onPrint,
  onCancel,
  onView,
}: {
  sale: SaleResponse;
  printingId: number | null;
  cancelingId: number | null;
  canCancelSales: boolean;
  onPrint: (idSale: number) => void;
  onCancel: (idSale: number) => Promise<void>;
  onView: (idSale: number) => void;
}) => {
  const isCancelled = sale.status === "CANCELLED";
  const isCancelingThisSale = cancelingId === sale.idSale;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={printingId !== null}
        onClick={() => onPrint(sale.idSale)}
        title="Imprimir ticket"
        aria-label={`Imprimir ticket venta ${sale.saleNumber || sale.idSale}`}
      >
        {printingId === sale.idSale ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
      </Button>

      {!isCancelled && canCancelSales ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="destructive"
                size="icon"
                disabled={cancelingId !== null}
                title="Anular venta"
                aria-label={`Anular venta ${sale.saleNumber || sale.idSale}`}
              />
            }
          >
            {isCancelingThisSale ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Anular venta</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro de que desea anular esta venta? Esta acción
                revertirá el stock de los productos al depósito de origen de
                forma automática y es irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void onCancel(sale.idSale);
                }}
              >
                Confirmar anulación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <Button
        type="button"
        variant="outline"
        onClick={() => onView(sale.idSale)}
      >
        <Eye className="mr-1 h-4 w-4" />
        Ver detalle
      </Button>
    </div>
  );
};

const SaleHistoryCard = ({
  sale,
  printingId,
  cancelingId,
  canCancelSales,
  onPrint,
  onCancel,
  onView,
}: {
  sale: SaleResponse;
  printingId: number | null;
  cancelingId: number | null;
  canCancelSales: boolean;
  onPrint: (idSale: number) => void;
  onCancel: (idSale: number) => Promise<void>;
  onView: (idSale: number) => void;
}) => {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {sale.saleNumber || `#${sale.idSale}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(sale.saleDate)}
            </p>
          </div>
          <p className="text-lg font-bold">{formatMoney(sale.total)}</p>
        </div>

        <div>
          <p className="font-medium">{sale.customerName ?? "Consumidor final"}</p>
          <p className="text-sm text-muted-foreground">{sale.depositName}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={paymentStatusClassNames[sale.paymentStatus]}
          >
            {paymentStatusLabels[sale.paymentStatus]}
          </Badge>
          <Badge variant="outline" className={getDeliveryClassName(sale)}>
            {getDeliveryLabel(sale)}
          </Badge>
          <Badge variant="outline" className={saleStatusClassNames[sale.status]}>
            {sale.status === "CANCELLED" ? "Anulada" : "Completada"}
          </Badge>
        </div>

        <div className="grid gap-2 rounded-lg bg-muted/30 p-3 text-sm">
          <p className="font-medium">{getPaymentSummary(sale)}</p>
          <p className="text-muted-foreground">
            Confirmado {formatMoney(sale.confirmedAmount)}
          </p>
          {sale.collectedAmount > 0 ? (
            <p className="text-muted-foreground">
              Cobrado por cadete {formatMoney(sale.collectedAmount)}
            </p>
          ) : null}
          {sale.pendingAmount > 0 ? (
            <p className="text-muted-foreground">
              Pendiente {formatMoney(sale.pendingAmount)}
            </p>
          ) : null}
          <p className="text-muted-foreground">
            {sale.collectedAmount > 0
              ? `Por rendir ${formatMoney(sale.collectedAmount)}`
              : "Sin efectivo pendiente de rendición"}
          </p>
        </div>

        <SaleActions
          sale={sale}
          printingId={printingId}
          cancelingId={cancelingId}
          canCancelSales={canCancelSales}
          onPrint={onPrint}
          onCancel={onCancel}
          onView={onView}
        />
      </CardContent>
    </Card>
  );
};

export const SaleTable = ({
  sales,
  loading,
  cancelingId,
  onView,
  onCancel,
}: Props) => {
  const [printingId, setPrintingId] = useState<number | null>(null);
  const canCancelSales = useCan("sales.cancel");

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
    <>
      <div className="grid gap-3 lg:hidden">
        {sales.map((sale) => (
          <SaleHistoryCard
            key={sale.idSale}
            sale={sale}
            printingId={printingId}
            cancelingId={cancelingId}
            canCancelSales={canCancelSales}
            onPrint={handlePrintTicket}
            onCancel={onCancel}
            onView={onView}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venta</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Cobro</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Rendición</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.idSale}>
                <TableCell>
                  <div className="min-w-44">
                    <p className="font-semibold">
                      {sale.saleNumber || `#${sale.idSale}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sale.saleDate)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-52">
                    <p className="truncate font-medium">
                      {sale.customerName ?? "Consumidor final"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sale.depositName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="min-w-56 space-y-1">
                    <Badge
                      variant="outline"
                      className={paymentStatusClassNames[sale.paymentStatus]}
                    >
                      {paymentStatusLabels[sale.paymentStatus]}
                    </Badge>
                    <p className="truncate text-sm font-medium">
                      {getPaymentSummary(sale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Confirmado {formatMoney(sale.confirmedAmount)}
                    </p>
                    {sale.collectedAmount > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Cobrado por cadete {formatMoney(sale.collectedAmount)}
                      </p>
                    ) : null}
                    {sale.pendingAmount > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Pendiente {formatMoney(sale.pendingAmount)}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getDeliveryClassName(sale)}>
                    {getDeliveryLabel(sale)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {sale.collectedAmount > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-violet-200 bg-violet-50 text-violet-700"
                    >
                      Por rendir {formatMoney(sale.collectedAmount)}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Sin pendiente
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatMoney(sale.total)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={saleStatusClassNames[sale.status]}>
                    {sale.status === "CANCELLED" ? "Anulada" : "Completada"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <SaleActions
                    sale={sale}
                    printingId={printingId}
                    cancelingId={cancelingId}
                    canCancelSales={canCancelSales}
                    onPrint={handlePrintTicket}
                    onCancel={onCancel}
                    onView={onView}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
