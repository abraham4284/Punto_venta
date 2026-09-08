import { useEffect, useMemo } from "react";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateSettlementPaymentsTotal,
  formatSettlementDate,
  formatSettlementMoney,
} from "../helpers/cash-settlement.helpers";
import { useCashSettlementDetail } from "../hooks/useCashSettlementDetail";

export const CashSettlementDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settlement, loading, error, loadSettlement, reset } =
    useCashSettlementDetail();
  const paymentsTotal = useMemo(() => {
    return calculateSettlementPaymentsTotal(settlement?.payments ?? []);
  }, [settlement]);
  const totalMatches = Math.abs(paymentsTotal - (settlement?.totalAmount ?? 0)) < 0.01;

  useEffect(() => {
    const idCashSettlement = Number(id);

    if (Number.isFinite(idCashSettlement) && idCashSettlement > 0) {
      void loadSettlement(idCashSettlement);
    }

    return () => reset();
  }, [id, loadSettlement, reset]);

  if (loading) {
    return (
      <>
        <Meta title="Detalle de Rendición" />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Spinner />
        </main>
      </>
    );
  }

  if (error || !settlement) {
    return (
      <>
        <Meta title="Detalle de Rendición" />
        <section className="space-y-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Button>
          <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error || "Rendición no encontrada"}
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <Meta title="Detalle de Rendición" />
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Auditoría de caja
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Rendición #{settlement.idCashSettlement}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Detalle de pagos seleccionados y confirmados dentro de la caja receptora.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Cadete</p>
              <p className="mt-1 font-semibold">{settlement.collectorUserName}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Recibió</p>
              <p className="mt-1 font-semibold">{settlement.receivedByUserName}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Caja receptora</p>
              <p className="mt-1 font-semibold">Sesión #{settlement.idCashSession}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total rendido</p>
              <p className="mt-1 text-xl font-bold">
                {formatSettlementMoney(settlement.totalAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4" />
              Datos de la rendición
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Fecha de rendición: </span>
                <strong>{formatSettlementDate(settlement.settledAt)}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Creada: </span>
                <strong>{formatSettlementDate(settlement.createdAt)}</strong>
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Observación</p>
              <p className="rounded-lg border bg-muted/20 p-3">
                {settlement.observation || "Sin observación"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Pagos incluidos</CardTitle>
              <Badge variant={totalMatches ? "outline" : "destructive"}>
                Suma visual: {formatSettlementMoney(paymentsTotal)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!totalMatches ? (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                El total histórico de pagos no coincide exactamente con el total
                autoritativo de la rendición.
              </p>
            ) : null}

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venta</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cobrado</TableHead>
                    <TableHead>Confirmado</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.payments.map((payment) => (
                    <TableRow key={payment.idSalePayment}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/admin/sales/${payment.idSale}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {payment.saleNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{payment.paymentMethodName}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-600">{payment.status}</Badge>
                      </TableCell>
                      <TableCell>{formatSettlementDate(payment.collectedAt)}</TableCell>
                      <TableCell>{formatSettlementDate(payment.confirmedAt)}</TableCell>
                      <TableCell>{payment.reference || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatSettlementMoney(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">
              {settlement.payments.map((payment) => (
                <article
                  key={payment.idSalePayment}
                  className="rounded-xl border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/admin/sales/${payment.idSale}`}
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {payment.saleNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentMethodName}
                      </p>
                    </div>
                    <Badge className="bg-emerald-600">{payment.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                    <p>Cobrado: {formatSettlementDate(payment.collectedAt)}</p>
                    <p>Confirmado: {formatSettlementDate(payment.confirmedAt)}</p>
                    <p>Referencia: {payment.reference || "-"}</p>
                    {payment.observation ? <p>Obs: {payment.observation}</p> : null}
                  </div>
                  <p className="mt-3 text-right text-lg font-bold">
                    {formatSettlementMoney(payment.amount)}
                  </p>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
};
