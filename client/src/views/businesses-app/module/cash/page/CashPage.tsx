import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, LockKeyhole, Plus, RefreshCcw } from "lucide-react";
import { Meta } from "@/components/Meta";
import { ViewLoadingState } from "@/components/loading/ViewLoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";
import { useCash } from "../hooks/useCash";
import { CloseCashSessionModal } from "../components/CloseCashSessionModal";
import { CreateCashMovementModal } from "../components/CreateCashMovementModal";
import { OpenCashSessionModal } from "../components/OpenCashSessionModal";

const formatMoney = (value: number): string => {
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

export const CashPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [movementModal, setMovementModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [initialLoadResolved, setInitialLoadResolved] = useState(false);
  const {
    registers,
    currentSession,
    summary,
    movements,
    loading,
    saving,
    error,
    refreshDashboard,
    openSession,
    closeSession,
    createMovement,
  } = useCash();

  useEffect(() => {
    if (loading || initialLoadResolved) return;

    const timeoutId = window.setTimeout(() => {
      setInitialLoadResolved(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialLoadResolved, loading]);

  const hasOpenSession = currentSession?.status === "OPEN";
  const isInitialLoading = loading && !initialLoadResolved;
  const isRefreshing = loading && initialLoadResolved;

  return (
    <>
      <Meta title="Caja" />
      <main className="space-y-6 p-2 md:p-6">
        <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Caja actual</h1>
            <p className="text-muted-foreground">
              Control de apertura, movimientos y cierre del turno.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isRefreshing}
              onClick={() => void refreshDashboard()}
            >
              <RefreshCcw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
            {hasOpenSession ? (
              <>
                <Button type="button" onClick={() => setMovementModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Movimiento
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setCloseModal(true)}
                >
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  Cerrar caja
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setOpenModal(true)}>
                Abrir caja
              </Button>
            )}
          </div>
        </section>

        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        {isInitialLoading && (
          <ViewLoadingState
            message="Cargando caja..."
            description="Obteniendo el estado actual de la caja."
          />
        )}

        {!hasOpenSession && (!loading || initialLoadResolved) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="text-xl font-semibold">No hay caja abierta</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Debes abrir una caja antes de registrar una venta. El sistema no permite ventas sin sesion de caja.
              </p>
              <Button type="button" onClick={() => setOpenModal(true)}>
                Abrir caja ahora
              </Button>
            </CardContent>
          </Card>
        )}

        {hasOpenSession && summary && (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Caja</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.cashRegisterName}</p>
                  <p className="text-xs text-muted-foreground">Abierta {formatDateTime(summary.openedAt)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Efectivo esperado</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{formatMoney(summary.expectedCash)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Ventas del turno</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{formatMoney(summary.totalSales)}</p><p className="text-xs text-muted-foreground">{summary.salesCount} ventas</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Movimientos</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{formatMoney(summary.manualIncome - summary.manualExpense)}</p><p className="text-xs text-muted-foreground">Ingresos menos egresos</p></CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Ventas por metodo</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {summary.summaryByPaymentMethod.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin ventas registradas.</p>
                  ) : (
                    summary.summaryByPaymentMethod.map((payment) => (
                      <div key={payment.idPaymentMethod} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{payment.paymentMethodName}</p>
                          <p className="text-xs text-muted-foreground">{payment.affectsCash ? "Suma al efectivo" : "No suma al efectivo"} - {payment.salesCount} ventas</p>
                        </div>
                        <strong>{formatMoney(payment.totalAmount)}</strong>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Movimientos recientes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {movements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin movimientos manuales.</p>
                  ) : (
                    movements.slice(0, 8).map((movement) => (
                      <div key={movement.idCashMovement} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          {movement.movementType === "INCOME" ? <ArrowUpCircle className="h-5 w-5 text-emerald-600" /> : <ArrowDownCircle className="h-5 w-5 text-red-600" />}
                          <div>
                            <p className="font-medium">{movement.category}</p>
                            <p className="text-xs text-muted-foreground">{movement.userName} - {formatDateTime(movement.createdAt)}</p>
                          </div>
                        </div>
                        <strong>{formatMoney(movement.amount)}</strong>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>
      <OpenCashSessionModal
        isOpen={openModal}
        registers={registers}
        saving={saving}
        onClose={() => setOpenModal(false)}
        onSubmit={openSession}
      />
      <CreateCashMovementModal
        isOpen={movementModal}
        saving={saving}
        onClose={() => setMovementModal(false)}
        onSubmit={(body) => currentSession ? createMovement(currentSession.idCashSession, body) : Promise.resolve(false)}
      />
      <CloseCashSessionModal
        isOpen={closeModal}
        summary={summary}
        saving={saving}
        onClose={() => setCloseModal(false)}
        onSubmit={(body) => currentSession ? closeSession(currentSession.idCashSession, body) : Promise.resolve(false)}
      />
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
};
