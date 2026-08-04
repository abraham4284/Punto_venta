import { ArrowDownCircle, ArrowUpCircle, Banknote, CreditCard, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type {
  CashLiveSummaryResponse,
  CashMovementResponse,
  CashSessionResponse,
} from "../types";

interface CashSessionDetailModalProps {
  isOpen: boolean;
  session: CashSessionResponse | null;
  summary: CashLiveSummaryResponse | null;
  movements: CashMovementResponse[];
  loading: boolean;
  onClose: () => void;
}

const formatMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const getMovementLabel = (type: CashMovementResponse["movementType"]) => {
  return type === "INCOME" ? "Ingreso" : "Egreso";
};

const getPaymentTone = (code: string, affectsCash: boolean) => {
  if (affectsCash || code === "CASH") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (code === "TRANSFER") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-slate-50 text-slate-800";
};

export const CashSessionDetailModal = ({
  isOpen,
  session,
  summary,
  movements,
  loading,
  onClose,
}: CashSessionDetailModalProps) => {
  const transferSummary = summary?.summaryByPaymentMethod.find(
    (payment) => payment.paymentMethodCode === "TRANSFER",
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:max-w-[calc(100vw-3rem)] md:p-6 lg:w-[1080px] lg:max-w-[1080px] xl:w-[1180px] xl:max-w-[1180px]">
        <DialogHeader>
          <DialogTitle>Detalle de sesión de caja</DialogTitle>
          <DialogDescription>
            Resumen operativo de ventas, cobros y movimientos manuales.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Cargando detalle de caja...
          </div>
        ) : (
          <div className="space-y-5 lg:space-y-6">
            <section className="flex flex-col gap-3 rounded-2xl border bg-slate-50 p-4 md:flex-row md:items-center md:justify-between lg:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Caja
                </p>
                <h3 className="text-lg font-bold">
                  {session?.cashRegisterName || summary?.cashRegisterName || "-"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Abierta por {session?.openedByUserName || "-"} ·{" "}
                  {formatDateTime(session?.openedAt ?? summary?.openedAt ?? null)}
                </p>
              </div>
              <Badge
                className={
                  session?.status === "OPEN"
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-200"
                }
              >
                {session?.status === "OPEN" ? "Abierta" : "Cerrada"}
              </Badge>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="min-h-[132px] p-4 lg:p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Efectivo esperado</p>
                  <p className="text-xl font-bold">
                    {formatMoney(summary?.expectedCash)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="min-h-[132px] p-4 lg:p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Ventas totales</p>
                  <p className="text-xl font-bold">{formatMoney(summary?.totalSales)}</p>
                  <p className="text-xs text-muted-foreground">
                    {summary?.salesCount ?? 0} ventas procesadas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="min-h-[132px] p-4 lg:p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Ventas en efectivo</p>
                  <p className="text-xl font-bold">{formatMoney(summary?.cashSales)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="min-h-[132px] p-4 lg:p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Transferencias</p>
                  <p className="text-xl font-bold">
                    {formatMoney(transferSummary?.totalAmount ?? 0)}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Card>
                <CardContent className="space-y-3 p-4 lg:p-5">
                  <div>
                    <h4 className="font-semibold">Cobros por método de pago</h4>
                    <p className="text-sm text-muted-foreground">
                      Totalizado desde las ventas asociadas a esta sesión.
                    </p>
                  </div>
                  {summary?.summaryByPaymentMethod.length ? (
                    <div className="space-y-2">
                      {summary.summaryByPaymentMethod.map((payment) => (
                        <div
                          key={payment.idPaymentMethod}
                          className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${getPaymentTone(
                            payment.paymentMethodCode,
                            payment.affectsCash,
                          )}`}
                        >
                          <div>
                            <p className="font-medium">{payment.paymentMethodName}</p>
                            <p className="text-xs opacity-80">
                              {payment.salesCount} operaciones
                            </p>
                          </div>
                          <p className="font-bold">
                            {formatMoney(payment.totalAmount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border bg-slate-50 p-4 text-sm text-muted-foreground">
                      No hay ventas registradas para esta sesión.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3 p-4 lg:p-5">
                  <div>
                    <h4 className="font-semibold">Movimientos manuales</h4>
                    <p className="text-sm text-muted-foreground">
                      Ingresos y egresos cargados manualmente por usuarios.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                      <p className="text-xs">Ingresos</p>
                      <p className="text-lg font-bold">
                        {formatMoney(summary?.manualIncome)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
                      <p className="text-xs">Egresos</p>
                      <p className="text-lg font-bold">
                        {formatMoney(summary?.manualExpense)}
                      </p>
                    </div>
                  </div>
                  {movements.length ? (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {movements.map((movement) => (
                        <div
                          key={movement.idCashMovement}
                          className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="flex gap-3">
                            <div
                              className={
                                movement.movementType === "INCOME"
                                  ? "mt-0.5 text-emerald-600"
                                  : "mt-0.5 text-red-600"
                              }
                            >
                              {movement.movementType === "INCOME" ? (
                                <ArrowUpCircle className="h-5 w-5" />
                              ) : (
                                <ArrowDownCircle className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {getMovementLabel(movement.movementType)} ·{" "}
                                {movement.category}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {movement.userName} · {formatDateTime(movement.createdAt)}
                              </p>
                              {movement.description ? (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {movement.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <p
                            className={
                              movement.movementType === "INCOME"
                                ? "font-bold text-emerald-700"
                                : "font-bold text-red-700"
                            }
                          >
                            {formatMoney(movement.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border bg-slate-50 p-4 text-sm text-muted-foreground">
                      No hubo movimientos manuales en esta sesión.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-3 rounded-2xl border bg-white p-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Monto inicial</p>
                <p className="font-bold">{formatMoney(session?.openingAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto contado</p>
                <p className="font-bold">{formatMoney(session?.countedCashAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Diferencia</p>
                <p
                  className={
                    (session?.differenceAmount ?? 0) < 0
                      ? "font-bold text-red-700"
                      : "font-bold text-emerald-700"
                  }
                >
                  {formatMoney(session?.differenceAmount)}
                </p>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
