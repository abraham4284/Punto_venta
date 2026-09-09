import { ArrowLeft, Banknote, RefreshCw, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  formatSettlementDate,
  formatSettlementMoney,
} from "../helpers/cash-settlement.helpers";
import { useMyPendingSettlement } from "../hooks/useMyPendingSettlement";

export const MyPendingSettlementPage = () => {
  const { collector, loading, error, fetchMyPendingSettlement } =
    useMyPendingSettlement();

  return (
    <>
      <Meta title="Mi rendición" />
      <main className="space-y-5 bg-white p-3 md:p-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Link
              to="/admin/deliveries"
              className="inline-flex h-9 items-center rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted"
            >
              <ArrowLeft className="mr-2 size-4" />
              Volver a entregas
            </Link>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Cobros del cadete
              </p>
              <h1 className="text-2xl font-bold tracking-tight">Mi rendición</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Revisá el efectivo que cobraste en entregas y que todavía tenés
                pendiente de rendir en caja.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => {
              void fetchMyPendingSettlement();
            }}
          >
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </header>

        {error ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground">
            <Spinner />
            Cargando tu rendición...
          </div>
        ) : !collector ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <WalletCards className="size-10 text-muted-foreground" />
              <p className="mt-3 font-semibold">No tenés efectivo pendiente</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Cuando registres cobros en efectivo desde tus entregas,
                aparecerán en esta pantalla hasta que caja los reciba.
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Banknote className="size-4" />
                  Resumen pendiente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cadete</p>
                  <p className="text-lg font-semibold">
                    {collector.collectorUserName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Cobros</p>
                    <p className="text-2xl font-bold">{collector.paymentsCount}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">
                      {formatSettlementMoney(collector.totalAmount)}
                    </p>
                  </div>
                </div>
                <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
                  Este dinero queda pendiente hasta que un ADMIN u OWNER registre
                  la rendición desde caja.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cobros por rendir</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {collector.payments.map((payment) => (
                  <article
                    key={payment.idSalePayment}
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{payment.saleNumber}</p>
                        <Badge variant="outline">Pendiente de rendición</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.customerName || "Consumidor final"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cobrado: {formatSettlementDate(payment.collectedAt)}
                      </p>
                    </div>
                    <p className="text-xl font-bold">
                      {formatSettlementMoney(payment.amount)}
                    </p>
                  </article>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </>
  );
};
