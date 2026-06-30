import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockMetrics } from "../../types/stock.types";

type Props = {
  metrics: StockMetrics;
};

export const CardStockMetric = ({ metrics }: Props) => {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total productos en stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.total}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Categorías activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* <p className="text-3xl font-bold">{metrics.active}</p> */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Categorías inactivas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* <p className="text-3xl font-bold">{metrics.inactive}</p> */}
        </CardContent>
      </Card>
    </section>
  );
};