import { LockKeyhole, LogOut, RefreshCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/views/businesses-app";
import {
  formatSubscriptionDate,
  getSupportContactUrl,
} from "../helpers/subscriptionDisplay.helpers";
import { useBusinessSubscriptionStore } from "../store/businessSubscription.store";

export const SubscriptionBlockedView = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const subscriptionState = useBusinessSubscriptionStore(
    (state) => state.subscriptionState,
  );
  const loading = useBusinessSubscriptionStore((state) => state.loading);
  const refreshSubscription = useBusinessSubscriptionStore(
    (state) => state.refreshSubscription,
  );
  const notification = subscriptionState?.notification;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-red-100 shadow-sm">
        <CardContent className="space-y-6 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <LockKeyhole className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              Acceso operativo bloqueado
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {notification?.title || "Suscripcion no habilitada"}
            </h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              {notification?.message ||
                "El negocio no puede operar hasta regularizar su estado comercial."}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 text-left text-sm">
            <p>
              <span className="font-medium">Estado:</span>{" "}
              {subscriptionState?.subscription?.status || "Sin suscripcion"}
            </p>
            <p>
              <span className="font-medium">Fecha relevante:</span>{" "}
              {formatSubscriptionDate(subscriptionState?.timeline.relevantEndDate)}
            </p>
            {notification?.reason && (
              <p>
                <span className="font-medium">Motivo:</span> {notification.reason}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" asChild>
              <Link to="/admin/subscription">Ver mi suscripcion</Link>
            </Button>
            <Button type="button" asChild variant="outline">
              <a href={getSupportContactUrl()} target="_blank" rel="noreferrer">
                Contactar soporte
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={refreshSubscription}
            >
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              Reintentar
            </Button>
            <Button type="button" variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
