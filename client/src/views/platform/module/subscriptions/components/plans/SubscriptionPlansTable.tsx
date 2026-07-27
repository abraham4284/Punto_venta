import { Edit, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatMoney,
  getBillingPeriodLabel,
  getLimitLabel,
  getTrialLabel,
} from "../../helpers/subscription-format.helpers";
import type { SubscriptionPlan } from "../../types/subscriptions.types";

interface SubscriptionPlansTableProps {
  plans: SubscriptionPlan[];
  loading: boolean;
  canManage: boolean;
  actionLoading: string | null;
  onEdit: (plan: SubscriptionPlan) => void;
  onStatusChange: (idSubscriptionPlan: number, isActive: boolean) => void;
}

export const SubscriptionPlansTable = ({
  plans,
  loading,
  canManage,
  actionLoading,
  onEdit,
  onStatusChange,
}: SubscriptionPlansTableProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Prueba</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    Cargando planes...
                  </TableCell>
                </TableRow>
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    No hay planes para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.idSubscriptionPlan}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getBillingPeriodLabel(plan.billingPeriod)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatMoney(plan.price, plan.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        <p>Usuarios: {getLimitLabel(plan.maxUsers)}</p>
                        <p>Productos: {getLimitLabel(plan.maxProducts)}</p>
                        <p>Depositos: {getLimitLabel(plan.maxDeposits)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTrialLabel(plan.trialDays)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.isActive}
                        disabled={
                          !canManage ||
                          actionLoading === `plan-status-${plan.idSubscriptionPlan}`
                        }
                        onCheckedChange={(checked) =>
                          onStatusChange(plan.idSubscriptionPlan, checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={!canManage}
                        onClick={() => onEdit(plan)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled
                        title="Cambio rapido de estado"
                      >
                        <Power className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
