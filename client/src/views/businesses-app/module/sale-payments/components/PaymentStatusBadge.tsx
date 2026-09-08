import { Badge } from "@/components/ui/badge";
import type { SalePaymentStatus } from "../types";
import {
  salePaymentStatusClassNames,
  salePaymentStatusLabels,
} from "../helpers/sale-payment.helpers";

type PaymentStatusBadgeProps = {
  status: SalePaymentStatus;
};

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  return (
    <Badge variant="outline" className={salePaymentStatusClassNames[status]}>
      {salePaymentStatusLabels[status]}
    </Badge>
  );
};
