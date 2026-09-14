import { Bike, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { DeliveryUserOption, SaleDeliveryInput } from "../../types";
import { getFieldError } from "../../helpers/createSale.helpers";

type Props = {
  delivery: SaleDeliveryInput;
  deliveryUsers: DeliveryUserOption[];
  loadingUsers: boolean;
  disabled: boolean;
  errors: Record<string, string>;
  onToggle: (enabled: boolean) => void;
  onDeliveryChange: <K extends keyof SaleDeliveryInput>(
    field: K,
    value: SaleDeliveryInput[K],
  ) => void;
};

const getDeliveryUserLabel = (
  idUser: number | null,
  deliveryUsers: DeliveryUserOption[],
): string => {
  const selectedUser = deliveryUsers.find((user) => user.idUser === idUser);

  if (!selectedUser) return "Sin asignar";

  return `${selectedUser.name} (${selectedUser.username})`;
};

export const SaleDeliverySection = ({
  delivery,
  deliveryUsers,
  loadingUsers,
  disabled,
  errors,
  onToggle,
  onDeliveryChange,
}: Props) => {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Entrega</h2>
              <p className="text-sm text-muted-foreground">
                {delivery.enabled
                  ? `${delivery.recipientName || "Destinatario pendiente"} · ${
                      delivery.deliveryAddress || "Dirección pendiente"
                    }`
                  : "Sin entrega a domicilio"}
              </p>
            </div>
          </div>

          <Switch
            checked={delivery.enabled}
            onCheckedChange={onToggle}
            disabled={disabled}
            aria-label="Activar entrega a domicilio"
          />
        </div>

        {delivery.enabled && (
          <div className="space-y-2 rounded-lg bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Cadete</span>
              <span className="font-medium">
                {getDeliveryUserLabel(delivery.assignedToUserId, deliveryUsers)}
              </span>
            </div>
            {delivery.scheduledAt && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Programada</span>
                <span className="font-medium">{delivery.scheduledAt}</span>
              </div>
            )}
            <Badge variant="outline" className="w-fit">
              {delivery.assignedToUserId
                ? "Aparece en el panel del cadete"
                : "Pendiente de asignación"}
            </Badge>
          </div>
        )}

        {(getFieldError(errors, "delivery.recipientName") ||
          getFieldError(errors, "delivery.deliveryAddress")) && (
          <p className="text-sm text-destructive">
            {getFieldError(errors, "delivery.recipientName") ||
              getFieldError(errors, "delivery.deliveryAddress")}
          </p>
        )}

        <Dialog>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={disabled || !delivery.enabled}
              />
            }
          >
            <MapPin className="mr-2 h-4 w-4" />
            Configurar entrega
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configurar entrega</DialogTitle>
              <DialogDescription>
                Completá los datos necesarios para que el pedido pueda
                prepararse, asignarse o entregarse.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label>Cadete asignado</Label>
                <Select
                  value={
                    delivery.assignedToUserId
                      ? String(delivery.assignedToUserId)
                      : "none"
                  }
                  onValueChange={(value: string | null) => {
                    onDeliveryChange(
                      "assignedToUserId",
                      value && value !== "none" ? Number(value) : null,
                    );
                  }}
                  disabled={disabled || loadingUsers}
                >
                  <SelectTrigger className="w-full">
                    <span
                      className={
                        delivery.assignedToUserId
                          ? "flex flex-1 text-left"
                          : "flex flex-1 text-left text-muted-foreground"
                      }
                    >
                      {loadingUsers
                        ? "Cargando cadetes..."
                        : getDeliveryUserLabel(
                            delivery.assignedToUserId,
                            deliveryUsers,
                          )}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar por ahora</SelectItem>
                    {deliveryUsers.map((user) => (
                      <SelectItem key={user.idUser} value={String(user.idUser)}>
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>
                  Destinatario <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={delivery.recipientName}
                  onChange={(event) =>
                    onDeliveryChange("recipientName", event.target.value)
                  }
                  placeholder="Nombre de quien recibe"
                  disabled={disabled}
                />
                {getFieldError(errors, "delivery.recipientName") && (
                  <p className="text-sm text-destructive">
                    {getFieldError(errors, "delivery.recipientName")}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Teléfono</Label>
                <Input
                  value={delivery.recipientPhone}
                  onChange={(event) =>
                    onDeliveryChange("recipientPhone", event.target.value)
                  }
                  placeholder="Teléfono de contacto"
                  disabled={disabled}
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label>
                  Dirección <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={delivery.deliveryAddress}
                  onChange={(event) =>
                    onDeliveryChange("deliveryAddress", event.target.value)
                  }
                  placeholder="Calle, número, piso o referencias"
                  disabled={disabled}
                />
                {getFieldError(errors, "delivery.deliveryAddress") && (
                  <p className="text-sm text-destructive">
                    {getFieldError(errors, "delivery.deliveryAddress")}
                  </p>
                )}
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label>Referencia</Label>
                <Input
                  value={delivery.deliveryReference}
                  onChange={(event) =>
                    onDeliveryChange("deliveryReference", event.target.value)
                  }
                  placeholder="Entre calles, timbre, color de puerta"
                  disabled={disabled}
                />
              </div>

              <div className="grid gap-2">
                <Label>Fecha programada</Label>
                <Input
                  type="datetime-local"
                  value={delivery.scheduledAt}
                  onChange={(event) =>
                    onDeliveryChange("scheduledAt", event.target.value)
                  }
                  disabled={disabled}
                />
              </div>

              <div className="grid gap-2">
                <Label>Observación</Label>
                <Input
                  value={delivery.observation}
                  onChange={(event) =>
                    onDeliveryChange("observation", event.target.value)
                  }
                  placeholder="Detalle interno"
                  disabled={disabled}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
