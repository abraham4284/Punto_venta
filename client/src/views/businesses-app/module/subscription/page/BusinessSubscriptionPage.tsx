import {
  CalendarClock,
  Headphones,
  type LucideIcon,
  RefreshCcw,
  ShieldCheck,
  Users,
  Package,
  Warehouse,
} from "lucide-react";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatSubscriptionDate,
  formatSubscriptionMoney,
  getBillingPeriodLabel,
  getNotificationClasses,
  getSupportContactUrl,
} from "../helpers/subscriptionDisplay.helpers";
import { useBusinessSubscription } from "../hooks/useBusinessSubscription";
import { SubscriptionStatusBadge } from "../components/SubscriptionStatusBadge";
import type { SubscriptionResourceUsage } from "../types/businessSubscription.types";

const getUsageLabel = (usage?: SubscriptionResourceUsage): string => {
  if (!usage) return "-";
  if (usage.limit === null) return `${usage.current} - Sin limite`;
  return `${usage.current} de ${usage.limit}`;
};

const getUsageTone = (usage?: SubscriptionResourceUsage): string => {
  if (!usage || usage.limit === null) return "bg-sky-500";
  if (usage.limitReached) return "bg-red-500";
  if ((usage.remaining ?? 0) <= 2) return "bg-amber-500";
  return "bg-emerald-500";
};

const getUsagePercent = (usage?: SubscriptionResourceUsage): number => {
  if (!usage || usage.limit === null || usage.limit === 0) return 100;
  return Math.min(Math.round((usage.current / usage.limit) * 100), 100);
};

type UsageCard = {
  label: string;
  usage?: SubscriptionResourceUsage;
  Icon: LucideIcon;
};

export const BusinessSubscriptionPage = () => {
  const { subscriptionState, loading, error, refreshSubscription } =
    useBusinessSubscription();
  const subscription = subscriptionState?.subscription;
  const plan = subscriptionState?.plan;
  const notification = subscriptionState?.notification;
  const usageCards: UsageCard[] = [
    {
      label: "Usuarios",
      usage: subscriptionState?.usage.users,
      Icon: Users,
    },
    {
      label: "Productos",
      usage: subscriptionState?.usage.products,
      Icon: Package,
    },
    {
      label: "Depositos",
      usage: subscriptionState?.usage.deposits,
      Icon: Warehouse,
    },
  ];

  return (
    <>
      <Meta title="Mi suscripcion" />
      <section className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-3 bg-sky-50 text-sky-700 hover:bg-sky-50">
              Estado comercial
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Mi suscripcion
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulta el plan, fechas y habilitacion operativa del negocio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={refreshSubscription}
            >
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              Actualizar
            </Button>
            <a
              href={getSupportContactUrl()}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "default" })}
            >
              <Headphones className="h-4 w-4" />
              Soporte
            </a>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl border p-5",
            getNotificationClasses(notification?.severity),
          )}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {notification?.title || "Cargando estado comercial"}
              </p>
              <p className="mt-1 text-sm opacity-85">
                {notification?.message ||
                  "Estamos verificando la suscripcion del negocio."}
              </p>
              {notification?.reason && (
                <p className="mt-1 text-xs opacity-75">
                  Motivo: {notification.reason}
                </p>
              )}
            </div>
            <SubscriptionStatusBadge status={subscription?.status} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Plan contratado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-xl font-semibold">{plan?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periodo</p>
                <p className="font-medium">{getBillingPeriodLabel(plan?.billingPeriod)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio</p>
                <p className="font-medium">
                  {formatSubscriptionMoney(plan?.price, plan?.currency || "ARS")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Codigo</p>
                <p className="font-medium">{plan?.code || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-sky-600" />
                Fechas clave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Inicio</span>
                <span className="font-medium">
                  {formatSubscriptionDate(subscription?.startsAt)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Fin de periodo</span>
                <span className="font-medium">
                  {formatSubscriptionDate(subscription?.currentPeriodEnd)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Gracia hasta</span>
                <span className="font-medium">
                  {formatSubscriptionDate(subscription?.gracePeriodEndsAt)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Dias restantes</span>
                <span className="font-medium">
                  {subscriptionState?.timeline.daysRemaining ?? "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            {usageCards.map(({ label, usage, Icon }) => (
              <div key={label} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xl font-semibold">{getUsageLabel(usage)}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", getUsageTone(usage))}
                    style={{ width: `${getUsagePercent(usage)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {usage?.limit === null
                    ? "Recurso ilimitado para este plan"
                    : usage?.limitReached
                      ? "Limite alcanzado"
                      : `Restantes: ${usage?.remaining ?? 0}`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
};
