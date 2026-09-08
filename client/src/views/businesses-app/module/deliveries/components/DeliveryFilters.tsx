import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deliveryStatusLabels } from "../helpers/delivery.helpers";
import type { DeliveryFilters as DeliveryFiltersState, DeliveryStatus, DeliveryUserOption } from "../types";

type DeliveryFiltersProps = {
  filters: DeliveryFiltersState;
  users: DeliveryUserOption[];
  canViewAll: boolean;
  onApply: (filters: DeliveryFiltersState) => void;
};

const statusOptions: DeliveryStatus[] = [
  "PENDING",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
];

export const DeliveryFilters = ({
  filters,
  users,
  canViewAll,
  onApply,
}: DeliveryFiltersProps) => {
  const [search, setSearch] = useState(filters.search);
  const [status, setStatus] = useState<DeliveryStatus | "">(filters.status);
  const [assignedToUserId, setAssignedToUserId] = useState<number | null>(
    filters.assignedToUserId,
  );

  const selectedUserName = useMemo(() => {
    if (!assignedToUserId) return "Todos los cadetes";

    const selectedUser = users.find((user) => {
      return user.idUser === assignedToUserId;
    });

    return selectedUser
      ? `${selectedUser.name} (${selectedUser.username})`
      : "Todos los cadetes";
  }, [assignedToUserId, users]);

  const handleApply = () => {
    onApply({
      search,
      status,
      assignedToUserId: canViewAll ? assignedToUserId : null,
    });
  };

  const handleClear = () => {
    setSearch("");
    setStatus("");
    setAssignedToUserId(null);
    onApply({
      search: "",
      status: "",
      assignedToUserId: null,
    });
  };

  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto_auto] xl:grid-cols-[minmax(0,1fr)_220px_240px_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApply();
              }
            }}
            className="pl-9"
            placeholder="Buscar por venta, destinatario o dirección"
          />
        </div>

        <Select
          value={status || "ALL"}
          onValueChange={(value: string | null) => {
            setStatus(value && value !== "ALL" ? (value as DeliveryStatus) : "");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {deliveryStatusLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canViewAll ? (
          <Select
            value={assignedToUserId ? String(assignedToUserId) : "ALL"}
            onValueChange={(value: string | null) => {
              setAssignedToUserId(value && value !== "ALL" ? Number(value) : null);
            }}
          >
            <SelectTrigger className="w-full">
              <span
                className={
                  assignedToUserId
                    ? "flex flex-1 text-left"
                    : "flex flex-1 text-left text-muted-foreground"
                }
              >
                {selectedUserName}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los cadetes</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.idUser} value={String(user.idUser)}>
                  {user.name} ({user.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Button type="button" onClick={handleApply}>
          Aplicar filtros
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
      </CardContent>
    </Card>
  );
};
