import type { ElementType } from "react";
import { Card, CardContent } from "@/components/ui/card";

type OperationMetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ElementType;
};

export const OperationMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: OperationMetricCardProps) => {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="truncate text-xl font-bold">{value}</p>
          {subtitle ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
};
