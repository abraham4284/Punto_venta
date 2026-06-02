import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerMetrics as CustomerMetricsType } from "../../types/customers.types";

interface Props {
  metrics: CustomerMetricsType;
}

export const CustomerMetrics = ({ metrics }: Props) => {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.total}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clientes activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.active}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clientes inactivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.inactive}</p>
        </CardContent>
      </Card>
    </section>
  );
};