import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, MapPin, ReceiptText, Truck, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { ViewLoadingState } from "@/components/loading/ViewLoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { SalePaymentsPanel } from "../../sale-payments/components/SalePaymentsPanel";
import { AssignDeliveryDialog } from "../components/AssignDeliveryDialog";
import { DeliveryActions } from "../components/DeliveryActions";
import { DeliveryStatusBadge } from "../components/DeliveryStatusBadge";
import { DeliveryTimeline } from "../components/DeliveryTimeline";
import { FailDeliveryDialog } from "../components/FailDeliveryDialog";
import { RescheduleDeliveryDialog } from "../components/RescheduleDeliveryDialog";
import {
  formatDeliveryDate,
  formatDeliveryMoney,
  type DeliveryPermissions,
} from "../helpers/delivery.helpers";
import { useDeliveries } from "../hooks/useDeliveries";
import { useDeliveryEvents } from "../hooks/useDeliveryEvents";
import type { DeliveryResponse } from "../types";

const InfoItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
};

export const DeliveryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canViewAll = useCan("deliveries.view_all");
  const canAssign = useCan("deliveries.assign");
  const canUpdateStatus = useCan("deliveries.update_status");
  const permissions = useMemo<DeliveryPermissions>(() => {
    return {
      canAssign,
      canUpdateStatus,
      canViewAll,
    };
  }, [canAssign, canUpdateStatus, canViewAll]);
  const {
    selectedDelivery,
    deliveryUsers,
    detailLoading,
    usersLoading,
    actionLoadingId,
    error,
    fetchDeliveryById,
    fetchDeliveryUsers,
    resetSelectedDelivery,
    assignDelivery,
    startDelivery,
    deliverDelivery,
    failDelivery,
    rescheduleDelivery,
    cancelDelivery,
  } = useDeliveries({
    autoFetch: false,
    canViewAll,
    removeDetachedOnReschedule: false,
  });
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    loadEvents,
    refreshEvents,
    reset: resetEvents,
  } = useDeliveryEvents();
  const [assignDialogDelivery, setAssignDialogDelivery] =
    useState<DeliveryResponse | null>(null);
  const [failDialogDelivery, setFailDialogDelivery] =
    useState<DeliveryResponse | null>(null);
  const [rescheduleDialogDelivery, setRescheduleDialogDelivery] =
    useState<DeliveryResponse | null>(null);

  useEffect(() => {
    const deliveryId = Number(id);

    if (Number.isInteger(deliveryId) && deliveryId > 0) {
      void fetchDeliveryById(deliveryId);
      void loadEvents(deliveryId);
    }

    return () => {
      resetSelectedDelivery();
      resetEvents();
    };
  }, [fetchDeliveryById, id, loadEvents, resetEvents, resetSelectedDelivery]);

  useEffect(() => {
    if (canAssign) {
      void fetchDeliveryUsers();
    }
  }, [canAssign, fetchDeliveryUsers]);

  if (detailLoading) {
    return (
      <>
        <Meta title="Detalle de Entrega" />
        <ViewLoadingState
          message="Cargando entrega..."
          description="Preparando información operativa del pedido."
        />
      </>
    );
  }

  if (error || !selectedDelivery) {
    return (
      <>
        <Meta title="Detalle de Entrega" />
        <main className="space-y-4 bg-white p-3 md:p-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Button>
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error || "Entrega no encontrada"}
          </p>
        </main>
      </>
    );
  }

  const isActionLoading = actionLoadingId === selectedDelivery.idSaleDelivery;

  const refreshDeliveryEvents = async () => {
    await refreshEvents(selectedDelivery.idSaleDelivery);
  };

  const handleAssignDelivery = async (
    idSaleDelivery: number,
    assignedToUserId: number,
  ) => {
    const success = await assignDelivery(idSaleDelivery, assignedToUserId);

    if (success) {
      await refreshEvents(idSaleDelivery);
    }

    return success;
  };

  const handleStartDelivery = async (delivery: DeliveryResponse) => {
    const success = await startDelivery(delivery.idSaleDelivery);

    if (success) {
      await refreshEvents(delivery.idSaleDelivery);
    }
  };

  const handleDeliverDelivery = async (delivery: DeliveryResponse) => {
    const success = await deliverDelivery(delivery.idSaleDelivery);

    if (success) {
      await refreshEvents(delivery.idSaleDelivery);
    }
  };

  const handleFailDelivery = async (
    idSaleDelivery: number,
    data: { failureReason?: string | null; observation?: string | null },
  ) => {
    const success = await failDelivery(idSaleDelivery, data);

    if (success) {
      await refreshEvents(idSaleDelivery);
    }

    return success;
  };

  const handleRescheduleDelivery = async (
    idSaleDelivery: number,
    data: { scheduledAt?: string | null; observation?: string | null },
  ) => {
    const success = await rescheduleDelivery(idSaleDelivery, data);

    if (success && !canViewAll) {
      navigate("/admin/deliveries");
      return success;
    }

    if (success) {
      await refreshEvents(idSaleDelivery);
    }

    return success;
  };

  const handleCancelDelivery = async (delivery: DeliveryResponse) => {
    const success = await cancelDelivery(delivery.idSaleDelivery);

    if (success) {
      await refreshEvents(delivery.idSaleDelivery);
    }
  };

  return (
    <>
      <Meta title="Detalle de Entrega" />
      <main className="space-y-6 bg-white p-3 md:p-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="space-y-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 size-4" />
              Volver
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Entrega {selectedDelivery.saleNumber}
                </h1>
                <DeliveryStatusBadge status={selectedDelivery.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Seguimiento operativo de la entrega y sus datos de contacto.
              </p>
            </div>
          </div>

          <DeliveryActions
            delivery={selectedDelivery}
            permissions={permissions}
            loading={isActionLoading}
            onAssign={setAssignDialogDelivery}
            onStart={(delivery) => {
              void handleStartDelivery(delivery);
            }}
            onDeliver={(delivery) => {
              void handleDeliverDelivery(delivery);
            }}
            onFail={setFailDialogDelivery}
            onReschedule={setRescheduleDialogDelivery}
            onCancel={(delivery) => {
              void handleCancelDelivery(delivery);
            }}
          />
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <ReceiptText className="size-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Venta</p>
                <p className="font-semibold">{selectedDelivery.saleNumber}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Truck className="size-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold">
                  {formatDeliveryMoney(selectedDelivery.total)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <UserRound className="size-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Cadete</p>
                <p className="font-semibold">
                  {selectedDelivery.assignedUserName ?? "Sin asignar"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CalendarClock className="size-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Programada</p>
                <p className="font-semibold">
                  {formatDeliveryDate(selectedDelivery.scheduledAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Destino
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <InfoItem label="Destinatario" value={selectedDelivery.recipientName} />
                <InfoItem
                  label="Teléfono"
                  value={selectedDelivery.recipientPhone ?? "Sin informar"}
                />
                <div className="md:col-span-2">
                  <InfoItem label="Dirección" value={selectedDelivery.deliveryAddress} />
                </div>
                <div className="md:col-span-2">
                  <InfoItem
                    label="Referencia"
                    value={selectedDelivery.deliveryReference ?? "Sin referencias"}
                  />
                </div>
                <div className="md:col-span-2">
                  <InfoItem
                    label="Observación"
                    value={selectedDelivery.observation ?? "Sin observaciones"}
                  />
                </div>
              </CardContent>
            </Card>

            <SalePaymentsPanel
              idSale={selectedDelivery.idSale}
              saleNumber={selectedDelivery.saleNumber}
              saleTotal={selectedDelivery.total}
              saleStatus="COMPLETED"
              hasDelivery={true}
              deliveryStatus={selectedDelivery.status}
              assignedToUserId={selectedDelivery.assignedToUserId}
              context="delivery-detail"
            />
          </div>

          <aside className="space-y-6">
            <DeliveryTimeline
              events={events}
              loading={eventsLoading}
              error={eventsError}
              onRetry={() => {
                void refreshDeliveryEvents();
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Auditoría operativa</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <InfoItem
                  label="Creada por"
                  value={selectedDelivery.createdByUserName ?? "Sin informar"}
                />
                <InfoItem
                  label="Creada"
                  value={formatDeliveryDate(selectedDelivery.createdAt)}
                />
                <InfoItem
                  label="Asignada"
                  value={formatDeliveryDate(selectedDelivery.assignedAt)}
                />
                <InfoItem
                  label="En camino"
                  value={formatDeliveryDate(selectedDelivery.outForDeliveryAt)}
                />
                <InfoItem
                  label="Entregada"
                  value={formatDeliveryDate(selectedDelivery.deliveredAt)}
                />
                <InfoItem
                  label="Fallida"
                  value={formatDeliveryDate(selectedDelivery.failedAt)}
                />
                <InfoItem
                  label="Cancelada"
                  value={formatDeliveryDate(selectedDelivery.cancelledAt)}
                />
                {selectedDelivery.failureReason ? (
                  <InfoItem label="Motivo de falla" value={selectedDelivery.failureReason} />
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </section>

        <AssignDeliveryDialog
          delivery={assignDialogDelivery}
          users={deliveryUsers}
          loadingUsers={usersLoading}
          actionLoading={isActionLoading}
          isOpen={Boolean(assignDialogDelivery)}
          onClose={() => setAssignDialogDelivery(null)}
          onConfirm={handleAssignDelivery}
        />
        <FailDeliveryDialog
          delivery={failDialogDelivery}
          actionLoading={isActionLoading}
          isOpen={Boolean(failDialogDelivery)}
          onClose={() => setFailDialogDelivery(null)}
          onConfirm={handleFailDelivery}
        />
        <RescheduleDeliveryDialog
          delivery={rescheduleDialogDelivery}
          actionLoading={isActionLoading}
          isOpen={Boolean(rescheduleDialogDelivery)}
          onClose={() => setRescheduleDialogDelivery(null)}
          onConfirm={handleRescheduleDelivery}
        />
      </main>
    </>
  );
};
