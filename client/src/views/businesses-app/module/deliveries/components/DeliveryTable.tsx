import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeliveryActions } from "./DeliveryActions";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";
import {
  formatDeliveryDate,
  formatDeliveryMoney,
  type DeliveryPermissions,
} from "../helpers/delivery.helpers";
import type { DeliveryResponse } from "../types";

type DeliveryTableProps = {
  deliveries: DeliveryResponse[];
  loading: boolean;
  actionLoadingId: number | null;
  permissions: DeliveryPermissions;
  onView: (delivery: DeliveryResponse) => void;
  onAssign: (delivery: DeliveryResponse) => void;
  onStart: (delivery: DeliveryResponse) => void;
  onDeliver: (delivery: DeliveryResponse) => void;
  onFail: (delivery: DeliveryResponse) => void;
  onReschedule: (delivery: DeliveryResponse) => void;
  onCancel: (delivery: DeliveryResponse) => void;
};

export const DeliveryTable = ({
  deliveries,
  loading,
  actionLoadingId,
  permissions,
  onView,
  onAssign,
  onStart,
  onDeliver,
  onFail,
  onReschedule,
  onCancel,
}: DeliveryTableProps) => {
  return (
    <Card className="hidden lg:block">
      <CardHeader>
        <CardTitle>Historial operativo</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venta</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Cadete</TableHead>
              <TableHead>Programada</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando entregas...
                  </div>
                </TableCell>
              </TableRow>
            ) : deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No hay entregas para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery) => (
                <TableRow key={delivery.idSaleDelivery}>
                  <TableCell className="font-semibold">{delivery.saleNumber}</TableCell>
                  <TableCell>{delivery.recipientName}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="truncate">{delivery.deliveryAddress}</p>
                      {delivery.deliveryReference ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {delivery.deliveryReference}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{delivery.assignedUserName ?? "Sin asignar"}</TableCell>
                  <TableCell>{formatDeliveryDate(delivery.scheduledAt)}</TableCell>
                  <TableCell className="font-semibold">
                    {formatDeliveryMoney(delivery.total)}
                  </TableCell>
                  <TableCell>
                    <DeliveryStatusBadge status={delivery.status} />
                  </TableCell>
                  <TableCell>
                    <DeliveryActions
                      delivery={delivery}
                      permissions={permissions}
                      loading={actionLoadingId === delivery.idSaleDelivery}
                      allowDeliver={false}
                      onView={onView}
                      onAssign={onAssign}
                      onStart={onStart}
                      onDeliver={onDeliver}
                      onFail={onFail}
                      onReschedule={onReschedule}
                      onCancel={onCancel}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
