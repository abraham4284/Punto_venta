import { Building2, CreditCard, ShieldAlert, Wrench } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";

const metrics = [
  {
    title: "Negocios totales",
    value: "0",
    description: "Comercios registrados en la plataforma",
    icon: Building2,
  },
  {
    title: "Suscripciones activas",
    value: "0",
    description: "Planes habilitados actualmente",
    icon: CreditCard,
  },
  {
    title: "Alertas operativas",
    value: "0",
    description: "Casos pendientes de revision",
    icon: ShieldAlert,
  },
];

export const PlatformDashboardPage = () => {
  const platformUser = usePlatformAuthStore((state) => state.platformUser);

  return (
    <>
      <Meta title="Dashboard Plataforma" />
      <div className="grid gap-6">
        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:flex-row lg:items-end">
          <div className="space-y-2">
            <Badge className="bg-cyan-400/15 text-cyan-100">
              {platformUser?.platformRole || "SUPER_ADMIN"}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenido, {platformUser?.name || "Administrador"}
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Este es el panel interno para supervisar el crecimiento, estado
              comercial y control operativo de MaxiKiosco App.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card key={metric.title} className="border-slate-200 bg-white">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardDescription>{metric.title}</CardDescription>
                    <CardTitle className="text-3xl font-bold">
                      {metric.value}
                    </CardTitle>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon className="size-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="border-cyan-200 bg-gradient-to-br from-white to-cyan-50">
          <CardContent className="grid gap-5 p-6 md:grid-cols-[72px_1fr] md:items-center">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              <Wrench className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-950">
                Estamos trabajando en este modulo.
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Proximamente gestion integral de suscripciones, vencimientos y
                control operativo de comercios por falta de pago.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
