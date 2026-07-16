import { CheckCircle2, Package, TriangleAlert, XCircle } from "lucide-react";
import type { ProductMetrics as ProductMetricsType } from "../../types/products.types";

type Props = {
  metrics: ProductMetricsType;
};

const metricItems = [
  {
    key: "total",
    label: "Total productos",
    description: "Catalogo registrado",
    icon: Package,
    className: "bg-slate-100 text-slate-700",
  },
  {
    key: "minStockReached",
    label: "Stock minimo",
    description: "Requieren seguimiento",
    icon: TriangleAlert,
    className: "bg-amber-100 text-amber-700",
  },
  {
    key: "active",
    label: "Activos",
    description: "Disponibles para operar",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "inactive",
    label: "Inactivos",
    description: "Ocultos de la operacion",
    icon: XCircle,
    className: "bg-red-100 text-red-700",
  },
] as const;

export const ProductMetrics = ({ metrics }: Props) => {
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
    </section>
  );
};
