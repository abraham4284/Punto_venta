import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getPaymentStatusLabel,
  getSubscriptionEventLabel,
  getSubscriptionStatusLabel,
} from "../../helpers/subscription-format.helpers";
import type {
  SubscriptionEventType,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from "../../types/subscriptions.types";

interface StatusBadgeProps {
  status: SubscriptionStatus;
}

interface PaymentStatusBadgeProps {
  status: SubscriptionPaymentStatus;
}

interface EventBadgeProps {
  eventType: SubscriptionEventType;
}

export const SubscriptionStatusBadge = ({ status }: StatusBadgeProps) => {
  const classNameByStatus: Record<SubscriptionStatus, string> = {
    TRIAL: "border-sky-200 bg-sky-50 text-sky-700",
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PAST_DUE: "border-amber-200 bg-amber-50 text-amber-700",
    SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700",
    CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
    EXPIRED: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", classNameByStatus[status])}>
      {getSubscriptionStatusLabel(status)}
    </Badge>
  );
};

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const classNameByStatus: Record<SubscriptionPaymentStatus, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
    REFUNDED: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", classNameByStatus[status])}>
      {getPaymentStatusLabel(status)}
    </Badge>
  );
};

export const EventBadge = ({ eventType }: EventBadgeProps) => {
  return (
    <Badge variant="outline" className="border-cyan-200 bg-cyan-50 font-medium text-cyan-700">
      {getSubscriptionEventLabel(eventType)}
    </Badge>
  );
};
