import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  RefreshCcw,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import { usePlatformDashboard } from "../hooks/usePlatformDashboard";

const formatCurrency = (value: number | null) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
};

const formatDateTime = (date: Date | null) => {
  if (!date) return "Sin actualizar";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const statusColors = ["#0891b2", "#22c55e", "#f59e0b", "#f97316", "#ef4444", "#64748b"];

export const PlatformDashboardPage = () => {
  const platformUser = usePlatformAuthStore((state) => state.platformUser);
  const { dashboard, loading, error, updatedAt, refresh } = usePlatformDashboard();

  const cards = dashboard
    ? [
        {
          title: "Negocios totales",
          value: dashboard.businesses.total,
          detail: `${dashboard.businesses.active} activos`,
          icon: Building2,
        },
        {
          title: "Nuevos del mes",
          value: dashboard.businesses.newThisMonth,
          detail:
            dashboard.businesses.growthPercentage === null
              ? "Sin periodo comparable"
              : `${dashboard.businesses.growthPercentage}% vs mes anterior`,
          icon: Activity,
        },
        {
          title: "Suscripciones activas",
          value: dashboard.subscriptions.active,
          detail: `${dashboard.subscriptions.trial} en prueba`,
          icon: CreditCard,
        },
        {
          title: "Ingresos del mes",
          value: formatCurrency(dashboard.revenue.approvedThisMonth),
          detail:
            dashboard.revenue.monthlyVariationPercentage === null
              ? "Sin periodo comparable"
              : `${dashboard.revenue.monthlyVariationPercentage}% vs mes anterior`,
          icon: WalletCards,
        },
        {
          title: "MRR estimado",
          value:
            dashboard.revenue.estimatedMrr === null
              ? "Sin datos"
              : formatCurrency(dashboard.revenue.estimatedMrr),
          detail: "Planes mensuales activos",
          icon: CreditCard,
        },
        {
          title: "Actividad hoy",
          value: dashboard.activity.activeBusinessesToday,
          detail: `${dashboard.activity.salesToday} ventas registradas`,
          icon: Users,
        },
      ]
    : [];

  return (
    <>
      <Meta title="Dashboard Plataforma" />
      <div className="grid gap-6">
        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:flex-row lg:items-end">
          <div className="space-y-2">
            <Badge className="bg-cyan-400/15 text-cyan-100">
              {platformUser?.platformRole || "PLATFORM"}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenido, {platformUser?.name || "Administrador"}
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Control global de negocios, suscripciones, pagos SaaS y salud operativa.
            </p>
            <p className="text-xs text-slate-400">
              Ultima actualizacion: {formatDateTime(updatedAt)}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => void refresh()}
          >
            <RefreshCcw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refrescar
          </Button>
        </section>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm font-medium text-red-700">
              {error}
            </CardContent>
          </Card>
        )}

        {loading && !dashboard ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Cargando metricas de plataforma...
            </CardContent>
          </Card>
        ) : null}

        {dashboard ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <Card key={card.title} className="border-slate-200 bg-white">
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <div>
                        <CardDescription>{card.title}</CardDescription>
                        <CardTitle className="text-3xl font-bold">
                          {card.value}
                        </CardTitle>
                      </div>
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Icon className="size-5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{card.detail}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle>Nuevos negocios</CardTitle>
                  <CardDescription>Altas historicas por mes</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboard.charts.newBusinessesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#0891b2" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle>Pagos aprobados</CardTitle>
                  <CardDescription>Ingresos SaaS mensuales</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.charts.paymentsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                      <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle>Suscripciones</CardTitle>
                  <CardDescription>Distribucion por estado</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard.charts.subscriptionsByStatus}
                        dataKey="total"
                        nameKey="status"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {dashboard.charts.subscriptionsByStatus.map((entry, index) => (
                          <Cell
                            key={entry.status}
                            fill={statusColors[index % statusColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Alertas operativas</CardTitle>
                <CardDescription>Prioridades comerciales y operativas</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {dashboard.alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay alertas pendientes.
                  </p>
                ) : (
                  dashboard.alerts.map((alert) => (
                    <div
                      key={alert.type}
                      className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 size-5 text-amber-500" />
                        <div>
                          <p className="font-semibold">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{alert.total}</Badge>
                        {alert.targetUrl ? (
                          <Link
                            to={alert.targetUrl}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            Ver
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
};
