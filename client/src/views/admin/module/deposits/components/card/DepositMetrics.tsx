import { CheckCircle2, Star, Warehouse, XCircle } from "lucide-react";
import type { DepositMetrics as DepositMetricsType } from "../../types/deposits.types";

type Props = {
  metrics: DepositMetricsType;
};

const metricItems = [
  {
    key: "total",
    label: "Total depositos",
    description: "Ubicaciones registradas",
    icon: Warehouse,
    className: "bg-slate-100 text-slate-700",
  },
  {
    key: "active",
    label: "Activos",
    description: "Listos para operar",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "inactive",
    label: "Inactivos",
    description: "Fuera del flujo diario",
    icon: XCircle,
    className: "bg-red-100 text-red-700",
  },
] as const;

export const DepositMetrics = ({ metrics }: Props) => {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metricItems.map((item) => {
        const Icon = item.icon;
        const value = metrics[item.key];

        return (
          <article
            key={item.key}
            className="rounded-lg border bg-background p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-md ${item.className}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        );
      })}

      <article className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Predeterminado</p>
            <p className="mt-2 truncate text-xl font-semibold tracking-tight">
              {metrics.defaultDepositName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deposito usado por defecto
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-700">
            <Star className="h-5 w-5" />
          </div>
        </div>
      </article>
    </section>
  );
};
