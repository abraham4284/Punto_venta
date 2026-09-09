import { useEffect, useMemo, useState } from "react";
import { Banknote, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { formatSettlementMoney } from "../../cash-settlements/helpers/cash-settlement.helpers";
import { useMyPendingSettlement } from "../../cash-settlements/hooks/useMyPendingSettlement";
import { AssignDeliveryDialog } from "../components/AssignDeliveryDialog";
import { DeliveryFilters } from "../components/DeliveryFilters";
import { DeliveryList } from "../components/DeliveryList";
import { DeliveryPagination } from "../components/DeliveryPagination";
import { DeliveryTable } from "../components/DeliveryTable";
import { FailDeliveryDialog } from "../components/FailDeliveryDialog";
import { RescheduleDeliveryDialog } from "../components/RescheduleDeliveryDialog";
import type { DeliveryPermissions } from "../helpers/delivery.helpers";
import { useDeliveries } from "../hooks/useDeliveries";
import type { DeliveryResponse } from "../types";

export const DeliveriesPage = () => {
  const navigate = useNavigate();
  const canViewAll = useCan("deliveries.view_all");
  const canAssign = useCan("deliveries.assign");
  const canUpdateStatus = useCan("deliveries.update_status");
  const canCollectPayments = useCan("sale_payments.collect");
  const permissions = useMemo<DeliveryPermissions>(() => {
    return {
      canAssign,
      canUpdateStatus,
      canViewAll,
    };
  }, [canAssign, canUpdateStatus, canViewAll]);
  const {
    deliveries,
    deliveryUsers,
    filters,
    pagination,
    loading,
    usersLoading,
    actionLoadingId,
    error,
    applyFilters,
    changePage,
    fetchDeliveryUsers,
    assignDelivery,
    startDelivery,
    deliverDelivery,
    failDelivery,
    rescheduleDelivery,
    cancelDelivery,
  } = useDeliveries({ canViewAll });
  const {
    collector: myPendingSettlement,
    loading: myPendingSettlementLoading,
    fetchMyPendingSettlement,
  } = useMyPendingSettlement({ enabled: canCollectPayments });
  const [assignDialogDelivery, setAssignDialogDelivery] =
    useState<DeliveryResponse | null>(null);
  const [failDialogDelivery, setFailDialogDelivery] =
    useState<DeliveryResponse | null>(null);
  const [rescheduleDialogDelivery, setRescheduleDialogDelivery] =
    useState<DeliveryResponse | null>(null);

  useEffect(() => {
    if (canViewAll || canAssign) {
      void fetchDeliveryUsers();
    }
  }, [canAssign, canViewAll, fetchDeliveryUsers]);

  const isDialogActionLoading =
    actionLoadingId === assignDialogDelivery?.idSaleDelivery ||
    actionLoadingId === failDialogDelivery?.idSaleDelivery ||
    actionLoadingId === rescheduleDialogDelivery?.idSaleDelivery;

  const handleView = (delivery: DeliveryResponse) => {
    navigate(`/admin/deliveries/${delivery.idSaleDelivery}`);
  };

  return (
    <>
      <Meta title={canViewAll ? "Gestión de Entregas" : "Mis Entregas"} />
      <main className="space-y-5 bg-white p-3 md:p-6">
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Operación diaria</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {canViewAll ? "Gestión de entregas" : "Mis entregas"}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {canViewAll
              ? "Controlá pedidos pendientes, asignaciones y estados operativos de cada cadete."
              : "Revisá tus entregas asignadas y actualizá su estado desde una vista pensada para trabajar en movimiento."}
          </p>
        </section>

        <DeliveryFilters
          filters={filters}
          users={deliveryUsers}
          canViewAll={canViewAll}
          onApply={applyFilters}
        />

        {canCollectPayments ? (
          <Card className="border-primary/15 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Banknote className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">Efectivo por rendir</p>
                  <p className="text-sm text-muted-foreground">
                    {myPendingSettlementLoading
                      ? "Consultando cobros pendientes..."
                      : myPendingSettlement
                        ? `${myPendingSettlement.paymentsCount} cobros por ${formatSettlementMoney(
                            myPendingSettlement.totalAmount,
                          )}`
                        : "No tenés cobros pendientes de rendición."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={myPendingSettlementLoading}
                  onClick={() => {
                    void fetchMyPendingSettlement();
                  }}
                >
                  Actualizar
                </Button>
                <Link
                  to="/admin/deliveries/my-settlement"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Ver mi rendición
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DeliveryList
          deliveries={deliveries}
          loading={loading}
          actionLoadingId={actionLoadingId}
          permissions={permissions}
          onView={handleView}
          onAssign={setAssignDialogDelivery}
          onStart={(delivery) => {
            void startDelivery(delivery.idSaleDelivery);
          }}
          onDeliver={(delivery) => {
            void deliverDelivery(delivery.idSaleDelivery);
          }}
          onFail={setFailDialogDelivery}
          onReschedule={setRescheduleDialogDelivery}
          onCancel={(delivery) => {
            void cancelDelivery(delivery.idSaleDelivery);
          }}
        />

        <DeliveryTable
          deliveries={deliveries}
          loading={loading}
          actionLoadingId={actionLoadingId}
          permissions={permissions}
          onView={handleView}
          onAssign={setAssignDialogDelivery}
          onStart={(delivery) => {
            void startDelivery(delivery.idSaleDelivery);
          }}
          onDeliver={(delivery) => {
            void deliverDelivery(delivery.idSaleDelivery);
          }}
          onFail={setFailDialogDelivery}
          onReschedule={setRescheduleDialogDelivery}
          onCancel={(delivery) => {
            void cancelDelivery(delivery.idSaleDelivery);
          }}
        />

        <Card>
          <CardContent className="p-4">
            <DeliveryPagination pagination={pagination} onPageChange={changePage} />
          </CardContent>
        </Card>

        {!loading && deliveries.length > 0 ? (
          <Card className="border-primary/15 bg-primary/5 lg:hidden">
            <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
              Tocá una tarjeta para ver dirección, contacto y acciones válidas según el estado.
            </CardContent>
          </Card>
        ) : null}

        <AssignDeliveryDialog
          delivery={assignDialogDelivery}
          users={deliveryUsers}
          loadingUsers={usersLoading}
          actionLoading={isDialogActionLoading}
          isOpen={Boolean(assignDialogDelivery)}
          onClose={() => setAssignDialogDelivery(null)}
          onConfirm={assignDelivery}
        />
        <FailDeliveryDialog
          delivery={failDialogDelivery}
          actionLoading={isDialogActionLoading}
          isOpen={Boolean(failDialogDelivery)}
          onClose={() => setFailDialogDelivery(null)}
          onConfirm={failDelivery}
        />
        <RescheduleDeliveryDialog
          delivery={rescheduleDialogDelivery}
          actionLoading={isDialogActionLoading}
          isOpen={Boolean(rescheduleDialogDelivery)}
          onClose={() => setRescheduleDialogDelivery(null)}
          onConfirm={rescheduleDelivery}
        />
      </main>
    </>
  );
};
