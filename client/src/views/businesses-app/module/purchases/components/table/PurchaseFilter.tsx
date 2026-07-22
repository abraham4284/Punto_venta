import { useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import type { SupplierResponse } from "../../../suppliers/types";
import type { PurchaseFilters, PurchaseStatus } from "../../types";

type Props = {
  filters: PurchaseFilters;
  suppliers: SupplierResponse[];
  deposits: DepositResponse[];
  onApply: (filters: PurchaseFilters) => void;
};

const allValue = "all";

export const PurchaseFilter = ({
  filters,
  suppliers,
  deposits,
  onApply,
}: Props) => {
  const [localFilters, setLocalFilters] = useState<PurchaseFilters>(filters);
  const selectedSupplierName =
    suppliers.find((supplier) => supplier.idSupplier === localFilters.idSupplier)
      ?.name ?? "Todos";
  const selectedDepositName =
    deposits.find((deposit) => deposit.idDeposit === localFilters.idDeposit)
      ?.name ?? "Todos";
  const selectedStatusName =
    localFilters.status === "COMPLETED"
      ? "Completadas"
      : localFilters.status === "CANCELLED"
        ? "Anuladas"
        : "Todos";

  const handleApply = () => {
    onApply({ ...localFilters, page: 1 });
  };

  const handleClear = () => {
    const cleanFilters: PurchaseFilters = {
      page: 1,
      limit: filters.limit,
      purchaseNumber: "",
      idSupplier: null,
      idDeposit: null,
      status: null,
      startDate: "",
      endDate: "",
    };

    setLocalFilters(cleanFilters);
    onApply(cleanFilters);
  };

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="grid gap-2">
          <Label>Nro. compra</Label>
          <Input
            value={localFilters.purchaseNumber}
            onChange={(event) =>
              setLocalFilters((current) => ({
                ...current,
                purchaseNumber: event.target.value,
              }))
            }
            placeholder="CMP-20260720..."
          />
        </div>

        <div className="grid gap-2">
          <Label>Desde</Label>
          <Input
            type="date"
            value={localFilters.startDate}
            onChange={(event) =>
              setLocalFilters((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
          />
        </div>

        <div className="grid gap-2">
          <Label>Hasta</Label>
          <Input
            type="date"
            value={localFilters.endDate}
            onChange={(event) =>
              setLocalFilters((current) => ({
                ...current,
                endDate: event.target.value,
              }))
            }
          />
        </div>

        <div className="grid gap-2">
          <Label>Proveedor</Label>
          <Select
            value={
              localFilters.idSupplier
                ? String(localFilters.idSupplier)
                : allValue
            }
            onValueChange={(value) => {
              if (value === null) return;
              setLocalFilters((current) => ({
                ...current,
                idSupplier: value === allValue ? null : Number(value),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <span>{selectedSupplierName}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={allValue}>Todos</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem
                    key={supplier.idSupplier}
                    value={String(supplier.idSupplier)}
                  >
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Estado</Label>
          <Select
            value={localFilters.status ?? allValue}
            onValueChange={(value) => {
              if (value === null) return;
              setLocalFilters((current) => ({
                ...current,
                status:
                  value === allValue ? null : (value as PurchaseStatus),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <span>{selectedStatusName}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={allValue}>Todos</SelectItem>
                <SelectItem value="COMPLETED">Completadas</SelectItem>
                <SelectItem value="CANCELLED">Anuladas</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Deposito</Label>
          <Select
            value={
              localFilters.idDeposit ? String(localFilters.idDeposit) : allValue
            }
            onValueChange={(value) => {
              if (value === null) return;
              setLocalFilters((current) => ({
                ...current,
                idDeposit: value === allValue ? null : Number(value),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <span>{selectedDepositName}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={allValue}>Todos</SelectItem>
                {deposits.map((deposit) => (
                  <SelectItem
                    key={deposit.idDeposit}
                    value={String(deposit.idDeposit)}
                  >
                    {deposit.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:justify-end xl:col-span-6">
          <Button type="button" variant="outline" onClick={handleClear}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
          <Button type="button" onClick={handleApply}>
            <Filter className="mr-2 h-4 w-4" />
            Aplicar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
