import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatMoney,
  getPaymentMethodLabel,
} from "../../helpers/subscription-format.helpers";
import type { SubscriptionPayment } from "../../types/subscriptions.types";
import { ConfirmAction } from "../shared/ConfirmAction";
import { PaymentStatusBadge } from "../shared/SubscriptionBadges";

interface SubscriptionPaymentsTableProps {
  payments: SubscriptionPayment[];
  loading: boolean;
  canOperate: boolean;
  onStatusAction: (
    idSubscriptionPayment: number,
    action: "approve" | "reject" | "cancel" | "refund",
  ) => void;
}

export const SubscriptionPaymentsTable = ({
  payments,
  loading,
  canOperate,
  onStatusAction,
}: SubscriptionPaymentsTableProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pago</TableHead>
                <TableHead>Negocio / Plan</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    Cargando pagos...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    No hay pagos para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.idSubscriptionPayment}>
                    <TableCell>
                      <p className="font-semibold">{payment.paymentNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{payment.businessName || "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.planName || "-"}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatMoney(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ConfirmAction
                          title="Aprobar pago"
                          description="La suscripcion asociada quedara actualizada segun la regla del backend."
                          actionLabel="Aprobar"
                          onConfirm={() =>
                            onStatusAction(payment.idSubscriptionPayment, "approve")
                          }
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!canOperate || payment.status === "APPROVED"}
                          >
                            <CheckCircle2 className="size-4 text-emerald-600" />
                          </Button>
                        </ConfirmAction>
                        <ConfirmAction
                          title="Rechazar pago"
                          description="El pago quedara rechazado para auditoria administrativa."
                          actionLabel="Rechazar"
                          onConfirm={() =>
                            onStatusAction(payment.idSubscriptionPayment, "reject")
                          }
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!canOperate || payment.status !== "PENDING"}
                          >
                            <XCircle className="size-4 text-red-600" />
                          </Button>
                        </ConfirmAction>
                        <ConfirmAction
                          title="Reembolsar pago"
                          description="El pago quedara marcado como reembolsado."
                          actionLabel="Reembolsar"
                          onConfirm={() =>
                            onStatusAction(payment.idSubscriptionPayment, "refund")
                          }
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!canOperate || payment.status !== "APPROVED"}
                          >
                            <RotateCcw className="size-4 text-violet-600" />
                          </Button>
                        </ConfirmAction>
                      </div>
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
