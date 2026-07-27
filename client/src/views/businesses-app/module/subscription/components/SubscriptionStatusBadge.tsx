import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSubscriptionStatusLabel } from "../helpers/subscriptionDisplay.helpers";
import type { SubscriptionStatus } from "../types/businessSubscription.types";

interface SubscriptionStatusBadgeProps {
  status?: SubscriptionStatus | null;
}

export const SubscriptionStatusBadge = ({
  status,
}: SubscriptionStatusBadgeProps) => {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
      : status === "TRIAL"
        ? "bg-sky-50 text-sky-700 hover:bg-sky-50"
        : status === "PAST_DUE"
          ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
          : "bg-red-50 text-red-700 hover:bg-red-50";

  return (
    <Badge variant="secondary" className={cn("rounded-full", className)}>
      {getSubscriptionStatusLabel(status)}
    </Badge>
  );
};
