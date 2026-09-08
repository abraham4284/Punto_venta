import { Loader2 } from "lucide-react";
import { DeliveryCard } from "./DeliveryCard";
import type { DeliveryPermissions } from "../helpers/delivery.helpers";
import type { DeliveryResponse } from "../types";

type DeliveryListProps = {
  deliveries: DeliveryResponse[];
  loading: boolean;
  actionLoadingId: number | null;
  permissions: DeliveryPermissions;
  onView: (delivery: DeliveryResponse) => void;
  onAssign: (delivery: DeliveryResponse) => void;
  onStart: (delivery: DeliveryResponse) => void;
  onDeliver: (delivery: DeliveryResponse) => void;
  onFail: (delivery: DeliveryResponse) => void;
  onReschedule: (delivery: DeliveryResponse) => void;
  onCancel: (delivery: DeliveryResponse) => void;
};

export const DeliveryList = ({
  deliveries,
  loading,
  actionLoadingId,
  permissions,
  onView,
  onAssign,
  onStart,
  onDeliver,
  onFail,
  onReschedule,
  onCancel,
}: DeliveryListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border bg-card p-10 text-sm text-muted-foreground lg:hidden">
        <Loader2 className="size-4 animate-spin" />
        Cargando entregas...
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground lg:hidden">
        No hay entregas para mostrar.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:hidden">
      {deliveries.map((delivery) => (
        <DeliveryCard
          key={delivery.idSaleDelivery}
          delivery={delivery}
          permissions={permissions}
          loading={actionLoadingId === delivery.idSaleDelivery}
          onView={onView}
          onAssign={onAssign}
          onStart={onStart}
          onDeliver={onDeliver}
          onFail={onFail}
          onReschedule={onReschedule}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
};
