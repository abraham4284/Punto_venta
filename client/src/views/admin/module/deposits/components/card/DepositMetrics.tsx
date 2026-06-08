import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepositMetrics as DepositMetricsType } from "../../types/deposits.types";

type Props = {
  metrics: DepositMetricsType;
};

export const DepositMetrics = ({ metrics }: Props) => {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total depósitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.total}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Depósitos activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.active}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Depósitos inactivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.inactive}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Predeterminado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="truncate text-lg font-semibold">
            {metrics.defaultDepositName}
          </p>
        </CardContent>
      </Card>
    </section>
  );
};