import { AlertTriangle, PackageX, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CriticalStockMetrics } from "../../types/stock.types";

interface CriticalMetricsProps {
  metrics: CriticalStockMetrics;
}

export const CriticalMetrics = ({ metrics }: CriticalMetricsProps) => {
  const cards = [
    {
      title: "Productos en riesgo",
      value: metrics.totalCriticalRisk,
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    {
      title: "Sin stock",
      value: metrics.zeroStock,
      icon: PackageX,
      className: "bg-red-50 text-red-700 ring-red-100",
    },
    {
      title: "Stock insuficiente",
      value: metrics.insufficientStock,
      icon: TrendingDown,
      className: "bg-orange-50 text-orange-700 ring-orange-100",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <strong className="mt-1 block text-2xl font-semibold">
                  {card.value}
                </strong>
              </div>
              <span className={`rounded-full p-3 ring-1 ${card.className}`}>
                <Icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
};
