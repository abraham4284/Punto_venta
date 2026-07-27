import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  CalendarClock,
  CreditCard,
  FileClock,
  Filter,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type {
  BillingPeriod,
  BusinessSubscription,
  BusinessSubscriptionFilters,
  SubscriptionEventFilters,
  SubscriptionPaymentFilters,
  SubscriptionPlan,
  SubscriptionPlanFilters,
  SubscriptionStatus,
} from "../types/subscriptions.types";
import { AssignSubscriptionModal } from "../components/subscriptions/AssignSubscriptionModal";
import { BusinessSubscriptionsTable } from "../components/subscriptions/BusinessSubscriptionsTable";
import { ConfirmAction } from "../components/shared/ConfirmAction";
import { SimplePagination } from "../components/shared/SimplePagination";
import { SubscriptionEventsTable } from "../components/events/SubscriptionEventsTable";
import { SubscriptionPaymentModal } from "../components/payments/SubscriptionPaymentModal";
import { SubscriptionActionReasonModal } from "../components/subscriptions/SubscriptionActionReasonModal";
import { SubscriptionPaymentsTable } from "../components/payments/SubscriptionPaymentsTable";
import { SubscriptionPlanModal } from "../components/plans/SubscriptionPlanModal";
import { SubscriptionPlansTable } from "../components/plans/SubscriptionPlansTable";

type SectionKey = "plans" | "subscriptions" | "payments" | "events";
type SubscriptionReasonAction = "SUSPEND" | "CANCEL";

const sections: Array<{
  key: SectionKey;
  label: string;
  icon: typeof CreditCard;
}> = [
  { key: "plans", label: "Planes", icon: CreditCard },
  { key: "subscriptions", label: "Suscripciones", icon: Activity },
  { key: "payments", label: "Pagos", icon: CalendarClock },
  { key: "events", label: "Auditoria", icon: FileClock },
];

const subscriptionStatusOptions: Array<{
  value: "ALL" | SubscriptionStatus;
  label: string;
}> = [
  { value: "ALL", label: "Todos" },
  { value: "TRIAL", label: "Prueba" },
  { value: "ACTIVE", label: "Activas" },
  { value: "PAST_DUE", label: "Vencidas" },
  { value: "SUSPENDED", label: "Suspendidas" },
  { value: "CANCELLED", label: "Canceladas" },
  { value: "EXPIRED", label: "Expiradas" },
];

const isSectionKey = (value: string | null): value is SectionKey => {
  return value === "plans" || value === "subscriptions" || value === "payments" || value === "events";
};

export const SubscriptionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get("section");
  const activeSection = isSectionKey(requestedSection) ? requestedSection : "plans";
  const platformUser = usePlatformAuthStore((state) => state.platformUser);
  const canManage = platformUser?.platformRole === "SUPER_ADMIN";
  const canOperate =
    platformUser?.platformRole === "SUPER_ADMIN" ||
    platformUser?.platformRole === "SUPPORT";

  const subscriptionsHook = useSubscriptions();
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [planEdit, setPlanEdit] = useState<SubscriptionPlan | null>(null);
  const [paymentSubscription, setPaymentSubscription] =
    useState<BusinessSubscription | null>(null);
  const [reasonAction, setReasonAction] =
    useState<SubscriptionReasonAction>("SUSPEND");
  const [reasonSubscription, setReasonSubscription] =
    useState<BusinessSubscription | null>(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);

  const [localPlanFilters, setLocalPlanFilters] =
    useState<SubscriptionPlanFilters>(subscriptionsHook.planFilters);
  const [localSubscriptionFilters, setLocalSubscriptionFilters] =
    useState<BusinessSubscriptionFilters>(subscriptionsHook.subscriptionFilters);
  const [localPaymentFilters, setLocalPaymentFilters] =
    useState<SubscriptionPaymentFilters>(subscriptionsHook.paymentFilters);
  const [localEventFilters, setLocalEventFilters] =
    useState<SubscriptionEventFilters>(subscriptionsHook.eventFilters);

  const metrics = useMemo(() => {
    return {
      plans: subscriptionsHook.plansPagination.totalRecords,
      subscriptions: subscriptionsHook.subscriptionsPagination.totalRecords,
      payments: subscriptionsHook.paymentsPagination.totalRecords,
      events: subscriptionsHook.eventsPagination.totalRecords,
    };
  }, [
    subscriptionsHook.eventsPagination.totalRecords,
    subscriptionsHook.paymentsPagination.totalRecords,
    subscriptionsHook.plansPagination.totalRecords,
    subscriptionsHook.subscriptionsPagination.totalRecords,
  ]);

  const changeSection = (section: SectionKey) => {
    setSearchParams({ section });
  };

  const openCreatePlan = () => {
    setPlanEdit(null);
    subscriptionsHook.clearFieldErrors();
    setPlanModalOpen(true);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setPlanEdit(plan);
    subscriptionsHook.clearFieldErrors();
    setPlanModalOpen(true);
  };

  const openPaymentModal = (subscription: BusinessSubscription | null = null) => {
    setPaymentSubscription(subscription);
    subscriptionsHook.clearFieldErrors();
    setPaymentModalOpen(true);
  };

  const openReasonModal = (
    actionType: SubscriptionReasonAction,
    subscription: BusinessSubscription,
  ) => {
    setReasonAction(actionType);
    setReasonSubscription(subscription);
    setReasonModalOpen(true);
  };

  const closeReasonModal = () => {
    setReasonModalOpen(false);
    setReasonSubscription(null);
  };

  const suspendWithReason = async (
    idBusinessSubscription: number,
    reason: string,
  ) => {
    const success = await subscriptionsHook.suspendSubscription(
      idBusinessSubscription,
      reason,
    );
    if (success) closeReasonModal();
  };

  const cancelWithReason = async (
    idBusinessSubscription: number,
    reason: string,
    cancelAtPeriodEnd: boolean,
  ) => {
    const success = await subscriptionsHook.cancelSubscription(
      idBusinessSubscription,
      reason,
      cancelAtPeriodEnd,
    );
    if (success) closeReasonModal();
  };

  return (
    <>
      <Meta title="Suscripciones SaaS" />
      <section className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Badge className="mb-3 bg-cyan-50 text-cyan-700 hover:bg-cyan-50">
              Plataforma
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Gestion de suscripciones
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Administra planes, estados comerciales, pagos y auditoria del SaaS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ConfirmAction
              title="Procesar vencimientos"
              description="El backend revisara suscripciones vencidas, pruebas expiradas y periodos de gracia."
              actionLabel="Procesar"
              onConfirm={subscriptionsHook.processExpirations}
            >
              <Button
                type="button"
                variant="outline"
                disabled={!canOperate || subscriptionsHook.actionLoading === "process-expirations"}
              >
                <RefreshCcw className="size-4" />
                Procesar vencimientos
              </Button>
            </ConfirmAction>
            <Button type="button" disabled={!canManage} onClick={openCreatePlan}>
              <Plus className="size-4" />
              Nuevo plan
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Planes", metrics.plans, CreditCard],
            ["Suscripciones", metrics.subscriptions, Activity],
            ["Pagos", metrics.payments, CalendarClock],
            ["Eventos", metrics.events, FileClock],
          ].map(([label, value, Icon]) => (
            <Card key={String(label)} className="border-slate-200">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{String(label)}</p>
                  <p className="text-2xl font-bold">{String(value)}</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.key}
                    type="button"
                    variant={activeSection === section.key ? "default" : "outline"}
                    onClick={() => changeSection(section.key)}
                    className={cn("justify-start", activeSection === section.key && "shadow-sm")}
                  >
                    <Icon className="size-4" />
                    {section.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSection === "plans" && (
              <>
                <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>Buscar plan</Label>
                    <Input
                      value={localPlanFilters.search}
                      onChange={(event) =>
                        setLocalPlanFilters({
                          ...localPlanFilters,
                          search: event.target.value,
                        })
                      }
                      placeholder="Nombre o codigo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Periodo</Label>
                    <Select
                      value={localPlanFilters.billingPeriod}
                      onValueChange={(value) => {
                        if (!value) return;
                        setLocalPlanFilters({
                          ...localPlanFilters,
                          billingPeriod: value as "ALL" | BillingPeriod,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ALL">Todos</SelectItem>
                          <SelectItem value="MONTHLY">Mensual</SelectItem>
                          <SelectItem value="YEARLY">Anual</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={localPlanFilters.isActive}
                      onValueChange={(value) => {
                        if (!value) return;
                        setLocalPlanFilters({
                          ...localPlanFilters,
                          isActive: value as SubscriptionPlanFilters["isActive"],
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ALL">Todos</SelectItem>
                          <SelectItem value="ACTIVE">Activos</SelectItem>
                          <SelectItem value="INACTIVE">Inactivos</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => subscriptionsHook.applyPlanFilters(localPlanFilters)}
                  >
                    <Filter className="size-4" />
                    Aplicar
                  </Button>
                </div>
                <SubscriptionPlansTable
                  plans={subscriptionsHook.plans}
                  loading={subscriptionsHook.loadingPlans}
                  canManage={canManage}
                  actionLoading={subscriptionsHook.actionLoading}
                  onEdit={openEditPlan}
                  onStatusChange={subscriptionsHook.changePlanStatus}
                />
                <SimplePagination
                  pagination={subscriptionsHook.plansPagination}
                  onPageChange={subscriptionsHook.setPlanPage}
                  disabled={subscriptionsHook.loadingPlans}
                />
              </>
            )}

            {activeSection === "subscriptions" && (
              <>
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 xl:flex-row xl:items-end">
                  <div className="grid flex-1 gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Buscar negocio</Label>
                      <Input
                        value={localSubscriptionFilters.search}
                        onChange={(event) =>
                          setLocalSubscriptionFilters({
                            ...localSubscriptionFilters,
                            search: event.target.value,
                          })
                        }
                        placeholder="Nombre o slug"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={localSubscriptionFilters.status}
                        onValueChange={(value) => {
                          if (!value) return;
                          setLocalSubscriptionFilters({
                            ...localSubscriptionFilters,
                            status: value as BusinessSubscriptionFilters["status"],
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {subscriptionStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select
                        value={localSubscriptionFilters.idSubscriptionPlan || "ALL"}
                        onValueChange={(value) => {
                          if (!value) return;
                          setLocalSubscriptionFilters({
                            ...localSubscriptionFilters,
                            idSubscriptionPlan: value === "ALL" ? "" : value,
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="ALL">Todos</SelectItem>
                            {subscriptionsHook.plans.map((plan) => (
                              <SelectItem
                                key={plan.idSubscriptionPlan}
                                value={String(plan.idSubscriptionPlan)}
                              >
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Periodo</Label>
                      <Select
                        value={localSubscriptionFilters.billingPeriod}
                        onValueChange={(value) => {
                          if (!value) return;
                          setLocalSubscriptionFilters({
                            ...localSubscriptionFilters,
                            billingPeriod: value as "ALL" | BillingPeriod,
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="MONTHLY">Mensual</SelectItem>
                            <SelectItem value="YEARLY">Anual</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        subscriptionsHook.applySubscriptionFilters(
                          localSubscriptionFilters,
                        )
                      }
                    >
                      <Filter className="size-4" />
                      Aplicar
                    </Button>
                    <Button
                      type="button"
                      disabled={!canManage}
                      onClick={() => setAssignModalOpen(true)}
                    >
                      <Plus className="size-4" />
                      Asignar
                    </Button>
                  </div>
                </div>
                <BusinessSubscriptionsTable
                  subscriptions={subscriptionsHook.subscriptions}
                  plans={subscriptionsHook.plans}
                  loading={subscriptionsHook.loadingSubscriptions}
                  actionLoading={subscriptionsHook.actionLoading}
                  canOperate={canOperate}
                  canManage={canManage}
                  onAutoRenew={subscriptionsHook.updateAutoRenew}
                  onReactivate={subscriptionsHook.reactivateSubscription}
                  onOpenSuspend={(subscription) =>
                    openReasonModal("SUSPEND", subscription)
                  }
                  onOpenCancel={(subscription) =>
                    openReasonModal("CANCEL", subscription)
                  }
                  onChangePlan={subscriptionsHook.changeSubscriptionPlan}
                  onOpenPayment={openPaymentModal}
                />
                <SimplePagination
                  pagination={subscriptionsHook.subscriptionsPagination}
                  onPageChange={subscriptionsHook.setSubscriptionPage}
                  disabled={subscriptionsHook.loadingSubscriptions}
                />
              </>
            )}

            {activeSection === "payments" && (
              <>
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="grid flex-1 gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>ID suscripcion</Label>
                      <Input
                        value={localPaymentFilters.idBusinessSubscription}
                        onChange={(event) =>
                          setLocalPaymentFilters({
                            ...localPaymentFilters,
                            idBusinessSubscription: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ID negocio</Label>
                      <Input
                        value={localPaymentFilters.idBusiness}
                        onChange={(event) =>
                          setLocalPaymentFilters({
                            ...localPaymentFilters,
                            idBusiness: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={localPaymentFilters.status}
                        onValueChange={(value) => {
                          if (!value) return;
                          setLocalPaymentFilters({
                            ...localPaymentFilters,
                            status: value as SubscriptionPaymentFilters["status"],
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="PENDING">Pendientes</SelectItem>
                            <SelectItem value="APPROVED">Aprobados</SelectItem>
                            <SelectItem value="REJECTED">Rechazados</SelectItem>
                            <SelectItem value="CANCELLED">Cancelados</SelectItem>
                            <SelectItem value="REFUNDED">Reembolsados</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Metodo</Label>
                      <Select
                        value={localPaymentFilters.paymentMethod}
                        onValueChange={(value) => {
                          if (!value) return;
                          setLocalPaymentFilters({
                            ...localPaymentFilters,
                            paymentMethod:
                              value as SubscriptionPaymentFilters["paymentMethod"],
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="CASH">Efectivo</SelectItem>
                            <SelectItem value="TRANSFER">Transferencia</SelectItem>
                            <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                            <SelectItem value="CARD">Tarjeta</SelectItem>
                            <SelectItem value="OTHER">Otro</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        subscriptionsHook.applyPaymentFilters(localPaymentFilters)
                      }
                    >
                      <Filter className="size-4" />
                      Aplicar
                    </Button>
                    <Button
                      type="button"
                      disabled={!canOperate}
                      onClick={() => openPaymentModal()}
                    >
                      <Plus className="size-4" />
                      Registrar pago
                    </Button>
                  </div>
                </div>
                <SubscriptionPaymentsTable
                  payments={subscriptionsHook.payments}
                  loading={subscriptionsHook.loadingPayments}
                  canOperate={canOperate}
                  onStatusAction={subscriptionsHook.updatePaymentStatus}
                />
                <SimplePagination
                  pagination={subscriptionsHook.paymentsPagination}
                  onPageChange={subscriptionsHook.setPaymentPage}
                  disabled={subscriptionsHook.loadingPayments}
                />
              </>
            )}

            {activeSection === "events" && (
              <>
                <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1fr_1fr_220px_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>ID suscripcion</Label>
                    <Input
                      value={localEventFilters.idBusinessSubscription}
                      onChange={(event) =>
                        setLocalEventFilters({
                          ...localEventFilters,
                          idBusinessSubscription: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID negocio</Label>
                    <Input
                      value={localEventFilters.idBusiness}
                      onChange={(event) =>
                        setLocalEventFilters({
                          ...localEventFilters,
                          idBusiness: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Evento</Label>
                    <Select
                      value={localEventFilters.eventType}
                      onValueChange={(value) => {
                        if (!value) return;
                        setLocalEventFilters({
                          ...localEventFilters,
                          eventType: value as SubscriptionEventFilters["eventType"],
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ALL">Todos</SelectItem>
                          <SelectItem value="PAYMENT_APPROVED">Pago aprobado</SelectItem>
                          <SelectItem value="SUBSCRIPTION_SUSPENDED">
                            Suscripcion suspendida
                          </SelectItem>
                          <SelectItem value="SUBSCRIPTION_REACTIVATED">
                            Suscripcion reactivada
                          </SelectItem>
                          <SelectItem value="SUBSCRIPTION_CANCELLED">
                            Suscripcion cancelada
                          </SelectItem>
                          <SelectItem value="PLAN_CHANGED">Plan modificado</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => subscriptionsHook.applyEventFilters(localEventFilters)}
                  >
                    <Filter className="size-4" />
                    Aplicar
                  </Button>
                </div>
                <SubscriptionEventsTable
                  events={subscriptionsHook.events}
                  loading={subscriptionsHook.loadingEvents}
                />
                <SimplePagination
                  pagination={subscriptionsHook.eventsPagination}
                  onPageChange={subscriptionsHook.setEventPage}
                  disabled={subscriptionsHook.loadingEvents}
                />
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <SubscriptionPlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        dataEdit={planEdit}
        fieldErrors={subscriptionsHook.fieldErrors}
        isSaving={
          subscriptionsHook.actionLoading === "create-plan" ||
          Boolean(
            planEdit &&
              subscriptionsHook.actionLoading ===
                `update-plan-${planEdit.idSubscriptionPlan}`,
          )
        }
        onCreate={subscriptionsHook.createPlan}
        onUpdate={subscriptionsHook.updatePlan}
        onClearErrors={subscriptionsHook.clearFieldErrors}
      />

      <AssignSubscriptionModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        plans={subscriptionsHook.plans}
        fieldErrors={subscriptionsHook.fieldErrors}
        isSaving={subscriptionsHook.actionLoading === "assign-subscription"}
        onAssign={subscriptionsHook.assignSubscription}
        onClearErrors={subscriptionsHook.clearFieldErrors}
      />

      <SubscriptionPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        subscriptions={subscriptionsHook.subscriptions}
        selectedSubscription={paymentSubscription}
        fieldErrors={subscriptionsHook.fieldErrors}
        isSaving={subscriptionsHook.actionLoading === "create-payment"}
        onCreate={subscriptionsHook.createPayment}
        onClearErrors={subscriptionsHook.clearFieldErrors}
      />

      <SubscriptionActionReasonModal
        isOpen={reasonModalOpen}
        actionType={reasonAction}
        subscription={reasonSubscription}
        isSaving={
          Boolean(
            reasonSubscription &&
              subscriptionsHook.actionLoading ===
                `${reasonAction === "SUSPEND" ? "suspend" : "cancel"}-subscription-${reasonSubscription.idBusinessSubscription}`,
          )
        }
        onClose={closeReasonModal}
        onSuspend={suspendWithReason}
        onCancel={cancelWithReason}
      />
    </>
  );
};
