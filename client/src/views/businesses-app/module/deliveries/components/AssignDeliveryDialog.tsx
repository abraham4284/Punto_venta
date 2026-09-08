import { useMemo, useState } from "react";
import { Loader2, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { DeliveryResponse, DeliveryUserOption } from "../types";

type AssignDeliveryDialogProps = {
  delivery: DeliveryResponse | null;
  users: DeliveryUserOption[];
  loadingUsers: boolean;
  actionLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (idSaleDelivery: number, assignedToUserId: number) => Promise<void>;
};

export const AssignDeliveryDialog = ({
  delivery,
  users,
  loadingUsers,
  actionLoading,
  isOpen,
  onClose,
  onConfirm,
}: AssignDeliveryDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const selectedUserLabel = useMemo(() => {
    const selectedUser = users.find((user) => {
      return user.idUser === Number(selectedUserId);
    });

    if (!selectedUser) return "Seleccioná un cadete";
    return `${selectedUser.name} (${selectedUser.username})`;
  }, [selectedUserId, users]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !actionLoading) {
      setSelectedUserId("");
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!delivery || !selectedUserId) return;

    await onConfirm(delivery.idSaleDelivery, Number(selectedUserId));
    setSelectedUserId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {delivery?.assignedToUserId ? "Reasignar entrega" : "Asignar entrega"}
          </DialogTitle>
          <DialogDescription>
            Seleccioná un usuario con rol cadete para operar esta entrega.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{delivery?.saleNumber ?? "Venta"}</p>
            <p className="text-muted-foreground">
              Actual: {delivery?.assignedUserName ?? "Sin asignar"}
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Cadete</Label>
            <Select
              value={selectedUserId}
              onValueChange={(value: string | null) => {
                setSelectedUserId(value ?? "");
              }}
              disabled={loadingUsers || actionLoading}
            >
              <SelectTrigger className="w-full">
                <span
                  className={
                    selectedUserId
                      ? "flex flex-1 text-left"
                      : "flex flex-1 text-left text-muted-foreground"
                  }
                >
                  {loadingUsers ? "Cargando cadetes..." : selectedUserLabel}
                </span>
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.idUser} value={String(user.idUser)}>
                    {user.name} ({user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={actionLoading}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!selectedUserId || actionLoading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {actionLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <UserRoundCheck className="mr-2 size-4" />
            )}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
