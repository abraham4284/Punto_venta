import { Ban, CreditCard, PauseCircle, PlayCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatMoney,
  getBillingPeriodLabel,
} from "../../helpers/subscription-format.helpers";
import type {
  BusinessSubscription,
  SubscriptionPlan,
} from "../../types/subscriptions.types";
import { ConfirmAction } from "../shared/ConfirmAction";
import { SubscriptionStatusBadge } from "../shared/SubscriptionBadges";

interface BusinessSubscriptionsTableProps {
  subscriptions: BusinessSubscription[];
  plans: SubscriptionPlan[];
  loading: boolean;
  actionLoading: string | null;
  canOperate: boolean;
  canManage: boolean;
  onAutoRenew: (idBusinessSubscription: number, autoRenew: boolean) => void;
  onReactivate: (idBusinessSubscription: number) => void;
  onOpenSuspend: (subscription: BusinessSubscription) => void;
  onOpenCancel: (subscription: BusinessSubscription) => void;
  onChangePlan: (
    idBusinessSubscription: number,
    idSubscriptionPlan: number,
  ) => void;
  onOpenPayment: (subscription: BusinessSubscription) => void;
}

export const BusinessSubscriptionsTable = ({
  subscriptions,
  plans,
  loading,
  actionLoading,
  canOperate,
  canManage,
  onAutoRenew,
  onReactivate,
  onOpenSuspend,
  onOpenCancel,
  onChangePlan,
  onOpenPayment,
}: BusinessSubscriptionsTableProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Auto-renueva</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    Cargando suscripciones...
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    No hay suscripciones para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.idBusinessSubscription}>
                    <TableCell>
                      <p className="font-semibold">{subscription.business.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {subscription.business.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{subscription.plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getBillingPeriodLabel(subscription.plan.billingPeriod)} -{" "}
                        {formatMoney(subscription.plan.price, subscription.plan.currency)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={subscription.status} />
                      {subscription.suspensionReason && (
                        <p className="mt-1 max-w-48 text-xs text-muted-foreground">
                          Suspension: {subscription.suspensionReason}
                        </p>
                      )}
                      {subscription.cancellationReason && (
                        <p className="mt-1 max-w-48 text-xs text-muted-foreground">
                          Cancelacion: {subscription.cancellationReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <p>Desde: {formatDate(subscription.currentPeriodStart)}</p>
                      <p>Hasta: {formatDate(subscription.currentPeriodEnd)}</p>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={subscription.autoRenew}
                        disabled={
                          !canOperate ||
                          actionLoading ===
                            `auto-renew-${subscription.idBusinessSubscription}`
                        }
                        onCheckedChange={(checked) =>
                          onAutoRenew(subscription.idBusinessSubscription, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={!canOperate}
                          onClick={() => onOpenPayment(subscription)}
                          title="Registrar pago"
                        >
                          <CreditCard className="size-4" />
                        </Button>
                        {subscription.status === "SUSPENDED" ? (
                          <ConfirmAction
                            title="Reactivar suscripcion"
                            description="El negocio recuperara acceso operativo si su plan esta vigente."
                            actionLabel="Reactivar"
                            onConfirm={() =>
                              onReactivate(subscription.idBusinessSubscription)
                            }
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={!canOperate}
                              title="Reactivar"
                            >
                              <PlayCircle className="size-4" />
                            </Button>
                          </ConfirmAction>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!canOperate || subscription.status === "CANCELLED"}
                            title="Suspender"
                            onClick={() => onOpenSuspend(subscription)}
                          >
                            <PauseCircle className="size-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={!canManage || subscription.status === "CANCELLED"}
                          title="Cancelar"
                          onClick={() => onOpenCancel(subscription)}
                        >
                          <Ban className="size-4" />
                        </Button>
                        {plans.length > 0 && (
                          <ConfirmAction
                            title="Cambiar al primer plan activo"
                            description="Para un cambio rapido se aplicara el primer plan activo diferente al actual."
                            actionLabel="Cambiar"
                            onConfirm={() => {
                              const nextPlan = plans.find(
                                (plan) =>
                                  plan.isActive &&
                                  plan.idSubscriptionPlan !==
                                    subscription.plan.idSubscriptionPlan,
                              );
                              if (nextPlan) {
                                onChangePlan(
                                  subscription.idBusinessSubscription,
                                  nextPlan.idSubscriptionPlan,
                                );
                              }
                            }}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={!canManage}
                              title="Cambiar plan"
                            >
                              <RefreshCcw className="size-4" />
                            </Button>
                          </ConfirmAction>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
