import {
  Boxes,
  PackageCheck,
  TriangleAlert,
  Warehouse,
  XCircle,
} from "lucide-react";
import type { StockMetrics } from "../../types/stock.types";

type Props = {
  metrics: StockMetrics;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const metricItems = [
  {
    key: "totalUnits",
    label: "Unidades totales",
    description: "Cantidad acumulada disponible",
    icon: Boxes,
    className: "bg-slate-100 text-slate-700",
  },
  {
    key: "uniqueProducts",
    label: "Productos con stock",
    description: "Productos presentes en inventario",
    icon: PackageCheck,
    className: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "lowStock",
    label: "Stock bajo",
    description: "Igual o debajo del minimo",
    icon: TriangleAlert,
    className: "bg-amber-100 text-amber-700",
  },
  {
    key: "zeroStock",
    label: "Sin stock",
    description: "Existencias agotadas",
    icon: XCircle,
    className: "bg-red-100 text-red-700",
  },
  {
    key: "activeDeposits",
    label: "Depositos usados",
    description: "Con existencias registradas",
    icon: Warehouse,
    className: "bg-sky-100 text-sky-700",
  },
] as const;

export const CardStockMetric = ({ metrics }: Props) => {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                  {formatNumber(value)}
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
