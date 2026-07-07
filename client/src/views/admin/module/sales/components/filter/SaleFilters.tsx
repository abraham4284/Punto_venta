import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import { SearchBox } from "../search/SearchBox";
import type { SaleFilters as SaleFiltersState } from "../../types";

type Props = {
  filters: SaleFiltersState;
  deposits: DepositResponse[];
  onChange: (filters: Partial<SaleFiltersState>) => void;
  onReset: () => void;
};

export const SaleFilters = ({
  filters,
  deposits,
  onChange,
  onReset,
}: Props) => {
  const [depositSearch, setDepositSearch] = useState("");
  const filteredDeposits = useMemo(() => {
    const value = depositSearch.trim().toLowerCase();
    const activeDeposits = deposits.filter((deposit) => deposit.isActive);

    if (!value) return activeDeposits.slice(0, 8);

    return activeDeposits
      .filter((deposit) => deposit.name.toLowerCase().includes(value))
      .slice(0, 8);
  }, [depositSearch, deposits]);

  return (
    <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-6">
      <div className="grid gap-2">
        <Label>N venta</Label>
        <Input
          value={filters.saleNumber}
          onChange={(event) => onChange({ saleNumber: event.target.value })}
          placeholder="Ej: VTA-20260707"
        />
      </div>

      <SearchBox
        label="Deposito"
        value={depositSearch}
        placeholder="Buscar deposito..."
        options={filteredDeposits}
        getKey={(deposit) => deposit.idDeposit}
        getLabel={(deposit) => deposit.name}
        onSearchChange={(value) => {
          setDepositSearch(value);
          onChange({ idDeposit: null });
        }}
        onSelect={(deposit) => {
          setDepositSearch(deposit.name);
          onChange({ idDeposit: deposit.idDeposit });
        }}
      />

      <div className="grid gap-2">
        <Label>Estado</Label>
        <Select
          value={filters.status ?? "ALL"}
          onValueChange={(value) =>
            onChange({
              status:
                value === "ALL" ? null : (value as "COMPLETED" | "CANCELLED"),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="COMPLETED">Completadas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Fecha inicio</Label>
        <Input
          type="date"
          value={filters.startDate}
          onChange={(event) => onChange({ startDate: event.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Fecha fin</Label>
        <Input
          type="date"
          value={filters.endDate}
          onChange={(event) => onChange({ endDate: event.target.value })}
        />
      </div>

      <div className="flex items-end">
        <Button type="button" variant="outline" onClick={onReset}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
};
