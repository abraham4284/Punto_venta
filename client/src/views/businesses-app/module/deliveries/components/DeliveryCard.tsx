import { MapPin, Phone, ReceiptText, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DeliveryActions } from "./DeliveryActions";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";
import {
  formatDeliveryDate,
  formatDeliveryMoney,
  type DeliveryPermissions,
} from "../helpers/delivery.helpers";
import type { DeliveryResponse } from "../types";

type DeliveryCardProps = {
  delivery: DeliveryResponse;
  permissions: DeliveryPermissions;
  loading: boolean;
  onView: (delivery: DeliveryResponse) => void;
  onAssign: (delivery: DeliveryResponse) => void;
  onStart: (delivery: DeliveryResponse) => void;
  onDeliver: (delivery: DeliveryResponse) => void;
  onFail: (delivery: DeliveryResponse) => void;
  onReschedule: (delivery: DeliveryResponse) => void;
  onCancel: (delivery: DeliveryResponse) => void;
};

export const DeliveryCard = ({
  delivery,
  permissions,
  loading,
  onView,
  onAssign,
  onStart,
  onDeliver,
  onFail,
  onReschedule,
  onCancel,
}: DeliveryCardProps) => {
  return (
    <Card>
      <CardContent className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ReceiptText className="size-4 text-muted-foreground" />
              {delivery.saleNumber}
            </p>
            <p className="mt-1 text-xl font-bold">
              {formatDeliveryMoney(delivery.total)}
            </p>
          </div>
          <DeliveryStatusBadge status={delivery.status} />
        </div>

        <div className="grid gap-3 text-sm">
          <div>
            <p className="font-medium">{delivery.recipientName}</p>
            <p className="text-muted-foreground">
              Programada: {formatDeliveryDate(delivery.scheduledAt)}
            </p>
          </div>

          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" />
            <span>{delivery.deliveryAddress}</span>
          </p>

          {delivery.recipientPhone ? (
            <a
              href={`tel:${delivery.recipientPhone}`}
              className="flex items-center gap-2 text-primary"
            >
              <Phone className="size-4" />
              {delivery.recipientPhone}
            </a>
          ) : null}

          <p className="flex items-center gap-2 text-muted-foreground">
            <UserRound className="size-4" />
            {delivery.assignedUserName ?? "Sin cadete asignado"}
          </p>
        </div>

        <DeliveryActions
          delivery={delivery}
          permissions={permissions}
          loading={loading}
          compact
          allowDeliver={false}
          onView={onView}
          onAssign={onAssign}
          onStart={onStart}
          onDeliver={onDeliver}
          onFail={onFail}
          onReschedule={onReschedule}
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
};
