import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  PackageCheck,
  RotateCcw,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  getAllowedDeliveryActions,
  type DeliveryAction,
  type DeliveryPermissions,
} from "../helpers/delivery.helpers";
import type { DeliveryResponse } from "../types";

type DeliveryActionsProps = {
  delivery: DeliveryResponse;
  permissions: DeliveryPermissions;
  loading: boolean;
  compact?: boolean;
  allowDeliver?: boolean;
  hasPendingCashPayment?: boolean;
  onView?: (delivery: DeliveryResponse) => void;
  onAssign: (delivery: DeliveryResponse) => void;
  onStart: (delivery: DeliveryResponse) => void;
  onDeliver: (delivery: DeliveryResponse) => void;
  onFail: (delivery: DeliveryResponse) => void;
  onReschedule: (delivery: DeliveryResponse) => void;
  onCancel: (delivery: DeliveryResponse) => void;
};

const hasAction = (actions: DeliveryAction[], action: DeliveryAction): boolean => {
  return actions.includes(action);
};

export const DeliveryActions = ({
  delivery,
  permissions,
  loading,
  compact = false,
  allowDeliver = true,
  hasPendingCashPayment = false,
  onView,
  onAssign,
  onStart,
  onDeliver,
  onFail,
  onReschedule,
  onCancel,
}: DeliveryActionsProps) => {
  const actions = getAllowedDeliveryActions(delivery, permissions);

  if (loading) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        <Loader2 className="mr-2 size-4 animate-spin" />
        Procesando
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {onView ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onView(delivery)}
        >
          Ver detalle
        </Button>
      ) : null}

      {hasAction(actions, "ASSIGN") ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onAssign(delivery)}
        >
          <UserRoundCheck className="mr-1 size-4" />
          {delivery.assignedToUserId ? "Reasignar" : "Asignar"}
        </Button>
      ) : null}

      {hasAction(actions, "START") ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onStart(delivery)}
        >
          <PackageCheck className="mr-1 size-4" />
          Iniciar
        </Button>
      ) : null}

      {hasAction(actions, "DELIVER") && allowDeliver && hasPendingCashPayment ? (
        <Button type="button" size="sm" variant="outline" disabled>
          <CheckCircle2 className="mr-1 size-4" />
          Registrá primero el cobro
        </Button>
      ) : null}

      {hasAction(actions, "DELIVER") && allowDeliver && !hasPendingCashPayment ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button type="button" size="sm" />}
          >
            <CheckCircle2 className="mr-1 size-4" />
            Entregada
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Marcar como entregada</AlertDialogTitle>
              <AlertDialogDescription>
                Confirmá que el pedido fue entregado al destinatario. Esta acción cierra la entrega.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDeliver(delivery);
                }}
              >
                Confirmar entrega
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {hasAction(actions, "FAIL") ? (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => onFail(delivery)}
        >
          <XCircle className="mr-1 size-4" />
          Falló
        </Button>
      ) : null}

      {hasAction(actions, "RESCHEDULE") ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onReschedule(delivery)}
        >
          <CalendarClock className="mr-1 size-4" />
          Reagendar
        </Button>
      ) : null}

      {hasAction(actions, "CANCEL") ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant={compact ? "outline" : "destructive"}
              />
            }
          >
            <RotateCcw className="mr-1 size-4" />
            Cancelar
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar entrega</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción cancela la entrega. La venta no se anula y el cobro no se modifica desde este flujo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onCancel(delivery);
                }}
              >
                Cancelar entrega
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
};
