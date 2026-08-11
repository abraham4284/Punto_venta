import { AlertTriangle, Headphones, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatSubscriptionDate,
  getNotificationClasses,
  getSupportContactUrl,
} from "../helpers/subscriptionDisplay.helpers";
import { useBusinessSubscriptionStore } from "../store/businessSubscription.store";

export const SubscriptionBanner = () => {
  const subscriptionState = useBusinessSubscriptionStore(
    (state) => state.subscriptionState,
  );
  const loading = useBusinessSubscriptionStore((state) => state.loading);
  const refreshSubscription = useBusinessSubscriptionStore(
    (state) => state.refreshSubscription,
  );

  const notification = subscriptionState?.notification;

  if (!notification?.shouldShowBanner) return null;

  return (
    <div
      className={cn(
        "mx-3 mt-3 rounded-xl border px-4 py-3 shadow-sm sm:mx-4 md:mx-6",
        getNotificationClasses(notification.severity),
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-lg bg-white/60 p-2">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{notification.title}</p>
            <p className="text-sm opacity-85">{notification.message}</p>
            {notification.reason && (
              <p className="text-xs opacity-75">Motivo: {notification.reason}</p>
            )}
            {subscriptionState?.timeline.relevantEndDate && (
              <p className="text-xs opacity-75">
                Fecha relevante:{" "}
                {formatSubscriptionDate(subscriptionState.timeline.relevantEndDate)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            to="/admin/subscription"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver suscripcion
          </Link>
          <a
            href={getSupportContactUrl()}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Headphones className="h-4 w-4" />
            Soporte
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={refreshSubscription}
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
};
