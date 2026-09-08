import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  HandCoins,
  Plus,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { useAuthStore } from "../../auth/store/auth.store";
import type { SaleDeliveryStatus } from "../../sales/types";
import { CancelPaymentDialog } from "./CancelPaymentDialog";
import { CollectPaymentDialog } from "./CollectPaymentDialog";
import { ConfirmPaymentDialog } from "./ConfirmPaymentDialog";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { PaymentEventsDialog } from "./PaymentEventsDialog";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import {
  formatPaymentDate,
  formatPaymentMoney,
  getRemainingBalance,
  salePaymentStatusDescriptions,
  type SalePaymentContext,
  type SalePaymentPermissions,
} from "../helpers/sale-payment.helpers";
import { useSalePayments } from "../hooks/useSalePayments";
import { useSalePaymentEvents } from "../hooks/useSalePaymentEvents";
import type { SalePaymentResponse } from "../types";

type SalePaymentsPanelProps = {
  idSale: number;
  saleNumber: string;
  saleTotal: number;
  saleStatus: "COMPLETED" | "CANCELLED";
  hasDelivery: boolean;
  deliveryStatus?: SaleDeliveryStatus | null;
  assignedToUserId?: number | null;
  context: SalePaymentContext;
  onPaymentChanged?: () => Promise<void> | void;
};

export const SalePaymentsPanel = ({
  idSale,
  saleNumber,
  saleTotal,
  saleStatus,
  hasDelivery,
  deliveryStatus = null,
  assignedToUserId = null,
  context,
  onPaymentChanged,
}: SalePaymentsPanelProps) => {
  const canView = useCan("sale_payments.view");
  const canCreate = useCan("sale_payments.create");
  const canUpdate = useCan("sale_payments.update");
  const canCancel = useCan("sale_payments.cancel");
  const canCollect = useCan("sale_payments.collect");
  const canConfirm = useCan("sale_payments.confirm");
  const permissions = useMemo<SalePaymentPermissions>(() => {
    return {
      canCreate,
      canUpdate,
      canCancel,
      canCollect,
      canConfirm,
    };
  }, [canCancel, canCollect, canConfirm, canCreate, canUpdate]);
  const currentUserId = useAuthStore((state) => state.user?.idUser ?? null);
  const {
    payments,
    paymentMethods,
    collectPaymentMethods,
    collectMethodsLoaded,
    currentCashSession,
    loading,
    collectMethodsLoading,
    cashSessionLoading,
    actionLoadingId,
    saving,
    error,
    fetchCurrentCashSession,
    fetchCollectPaymentMethods,
    createPayment,
    updatePayment,
    cancelPayment,
    collectPayment,
    confirmPayment,
  } = useSalePayments({
    idSale,
    enabled: canView,
    loadAdminPaymentMethods: context === "sale-detail",
    onPaymentChanged,
  });
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formOpen, setFormOpen] = useState(false);
  const [formPayment, setFormPayment] = useState<SalePaymentResponse | null>(null);
  const [cancelDialogPayment, setCancelDialogPayment] =
    useState<SalePaymentResponse | null>(null);
  const [confirmDialogPayment, setConfirmDialogPayment] =
    useState<SalePaymentResponse | null>(null);
  const [collectDialogPayment, setCollectDialogPayment] =
    useState<SalePaymentResponse | null>(null);
  const [eventsDialogPayment, setEventsDialogPayment] =
    useState<SalePaymentResponse | null>(null);
  const {
    events: paymentEvents,
    loading: paymentEventsLoading,
    error: paymentEventsError,
    loadEvents: loadPaymentEvents,
    reset: resetPaymentEvents,
  } = useSalePaymentEvents();
  const saleCancelled = saleStatus === "CANCELLED";
  const remaining = useMemo(() => {
    return getRemainingBalance(saleTotal, payments);
  }, [payments, saleTotal]);
  const canCreatePayment =
    context === "sale-detail" &&
    permissions.canCreate &&
    !saleCancelled &&
    remaining > 0;
  const canCollectFromDelivery =
    context === "delivery-detail" &&
    permissions.canCollect &&
    deliveryStatus === "OUT_FOR_DELIVERY" &&
    assignedToUserId !== null &&
    assignedToUserId === currentUserId;

  if (!canView) {
    return null;
  }

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormPayment(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (payment: SalePaymentResponse) => {
    setFormMode("edit");
    setFormPayment(payment);
    setFormOpen(true);
  };

  const handleOpenCollect = (payment: SalePaymentResponse) => {
    setCollectDialogPayment(payment);

    if (!payment.affectsCash) {
      void fetchCollectPaymentMethods();
    }
  };

  const handleOpenPaymentEvents = (payment: SalePaymentResponse) => {
    setEventsDialogPayment(payment);
    void loadPaymentEvents(payment.idSalePayment);
  };

  const handleClosePaymentEvents = () => {
    setEventsDialogPayment(null);
    resetPaymentEvents();
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" />
              Pagos de la venta
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {context === "delivery-detail"
                ? "Cobros vinculados a esta entrega."
                : "Gestión administrativa de pagos y saldo de la operación."}
            </p>
          </div>

          {canCreatePayment ? (
            <Button type="button" size="sm" onClick={handleOpenCreate}>
              <Plus className="mr-2 size-4" />
              Agregar pago
            </Button>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Total venta</p>
            <p className="text-lg font-semibold">{formatPaymentMoney(saleTotal)}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Saldo activo</p>
            <p className="text-lg font-semibold">{formatPaymentMoney(remaining)}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Venta</p>
            <p className="text-lg font-semibold">{saleNumber}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex min-h-28 items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : payments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Sin pagos registrados para esta venta.
          </div>
        ) : (
          payments.map((payment) => {
            const paymentLoading = actionLoadingId === payment.idSalePayment;
            const isPending = payment.status === "PENDING";
            const showSaleActions =
              context === "sale-detail" && isPending && !saleCancelled;
            const showCollect =
              canCollectFromDelivery &&
              isPending &&
              !saleCancelled &&
              deliveryStatus === "OUT_FOR_DELIVERY";

            return (
              <article
                key={payment.idSalePayment}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{payment.paymentMethodName}</p>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {salePaymentStatusDescriptions[payment.status]}
                    </p>
                    {payment.reference ? (
                      <p className="text-xs text-muted-foreground">
                        Ref: {payment.reference}
                      </p>
                    ) : null}
                    {payment.observation ? (
                      <p className="text-xs text-muted-foreground">
                        Obs: {payment.observation}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold">
                      {formatPaymentMoney(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creado: {formatPaymentDate(payment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {payment.collectedAt ? (
                    <Badge variant="outline">
                      Cobrado {formatPaymentDate(payment.collectedAt)}
                    </Badge>
                  ) : null}
                  {payment.confirmedAt ? (
                    <Badge variant="outline">
                      Confirmado {formatPaymentDate(payment.confirmedAt)}
                    </Badge>
                  ) : null}
                  {payment.cancelledAt ? (
                    <Badge variant="outline">
                      Anulado {formatPaymentDate(payment.cancelledAt)}
                    </Badge>
                  ) : null}
                  {payment.status === "COLLECTED" ? (
                    <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                      Pendiente de rendición
                    </Badge>
                  ) : null}
                </div>

                {showSaleActions || showCollect ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {showSaleActions && permissions.canUpdate ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={paymentLoading}
                        onClick={() => handleOpenEdit(payment)}
                      >
                        <Edit3 className="mr-2 size-4" />
                        Editar
                      </Button>
                    ) : null}
                    {showSaleActions && permissions.canCancel ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={paymentLoading}
                        onClick={() => setCancelDialogPayment(payment)}
                      >
                        <Ban className="mr-2 size-4" />
                        Anular
                      </Button>
                    ) : null}
                    {showSaleActions && permissions.canConfirm ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={paymentLoading}
                        onClick={() => setConfirmDialogPayment(payment)}
                      >
                        <CheckCircle2 className="mr-2 size-4" />
                        Confirmar
                      </Button>
                    ) : null}
                    {showCollect ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={paymentLoading || collectMethodsLoading}
                        onClick={() => handleOpenCollect(payment)}
                      >
                        {paymentLoading ? (
                          <Spinner className="mr-2 size-4" />
                        ) : (
                          <HandCoins className="mr-2 size-4" />
                        )}
                        Cobrar
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Ver historial del pago"
                    aria-label={`Ver historial del pago ${payment.idSalePayment}`}
                    onClick={() => handleOpenPaymentEvents(payment)}
                  >
                    <Clock3 className="mr-2 size-4" />
                    Historial
                  </Button>
                </div>
              </article>
            );
          })
        )}

        {!loading && context === "delivery-detail" && !canCollectFromDelivery ? (
          <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
            <Wallet className="mr-2 inline size-4" />
            El cobro operativo aparece solo para el cadete asignado cuando la entrega está en camino.
          </div>
        ) : null}
      </CardContent>

      <PaymentFormDialog
        isOpen={formOpen}
        mode={formMode}
        payment={formPayment}
        saleTotal={saleTotal}
        remaining={remaining}
        hasDelivery={hasDelivery}
        saleCancelled={saleCancelled}
        paymentMethods={paymentMethods}
        saving={saving || actionLoadingId === formPayment?.idSalePayment}
        cashSessionLoading={cashSessionLoading}
        currentCashSession={currentCashSession}
        onClose={() => {
          setFormOpen(false);
          setFormMode("create");
          setFormPayment(null);
        }}
        onLoadCashSession={fetchCurrentCashSession}
        onCreate={createPayment}
        onUpdate={updatePayment}
      />
      <CancelPaymentDialog
        payment={cancelDialogPayment}
        isOpen={Boolean(cancelDialogPayment)}
        loading={actionLoadingId === cancelDialogPayment?.idSalePayment}
        onClose={() => setCancelDialogPayment(null)}
        onConfirm={(idSalePayment, reason) =>
          cancelPayment(idSalePayment, { reason })
        }
      />
      <ConfirmPaymentDialog
        payment={confirmDialogPayment}
        isOpen={Boolean(confirmDialogPayment)}
        loading={actionLoadingId === confirmDialogPayment?.idSalePayment}
        cashSessionLoading={cashSessionLoading}
        currentCashSession={currentCashSession}
        onClose={() => setConfirmDialogPayment(null)}
        onLoadCashSession={fetchCurrentCashSession}
        onConfirm={confirmPayment}
      />
      <CollectPaymentDialog
        payment={collectDialogPayment}
        isOpen={Boolean(collectDialogPayment)}
        loading={actionLoadingId === collectDialogPayment?.idSalePayment}
        methodsLoading={collectMethodsLoading}
        methodsLoaded={collectMethodsLoaded}
        collectPaymentMethods={collectPaymentMethods}
        onClose={() => setCollectDialogPayment(null)}
        onLoadCollectMethods={fetchCollectPaymentMethods}
        onConfirm={collectPayment}
      />
      <PaymentEventsDialog
        payment={eventsDialogPayment}
        isOpen={Boolean(eventsDialogPayment)}
        events={paymentEvents}
        loading={paymentEventsLoading}
        error={paymentEventsError}
        onClose={handleClosePaymentEvents}
        onRetry={(idSalePayment) => {
          void loadPaymentEvents(idSalePayment);
        }}
      />
    </Card>
  );
};
