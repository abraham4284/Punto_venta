import { Badge } from "@/components/ui/badge";
import {
  deliveryStatusClassNames,
  deliveryStatusLabels,
} from "../helpers/delivery.helpers";
import type { DeliveryStatus } from "../types";

type DeliveryStatusBadgeProps = {
  status: DeliveryStatus;
};

export const DeliveryStatusBadge = ({ status }: DeliveryStatusBadgeProps) => {
  return (
    <Badge variant="outline" className={deliveryStatusClassNames[status]}>
      {deliveryStatusLabels[status]}
    </Badge>
  );
};
