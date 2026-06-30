import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockMovementFilter } from "../../types";
import type { DepositResponse } from "../../../deposits/types/deposits.types";

type Props = {
  search: string;
  filter: StockMovementFilter;
  depositFilter: number | null;
  deposits: DepositResponse[];
  onSearchChange: (value: string) => void;
  onFilterChange: (value: StockMovementFilter) => void;
  onDepositFilterChange: (value: number | null) => void;
};

const filterLabels: Record<StockMovementFilter, string> = {
  ALL: "Todos",
  IN: "Entradas",
  OUT: "Salidas",
  TRANSFER: "Transferencias",
};

export const MovementFilter = ({
  search,
  filter,
  depositFilter,
  deposits,
  onSearchChange,
  onFilterChange,
  onDepositFilterChange,
}: Props) => {
  const handleFilterChange = (value: string | null) => {
    if (!value) return;

    onFilterChange(value as StockMovementFilter);
  };

  const handleDepositChange = (value: string | null) => {
    if (!value || value === "ALL") {
      onDepositFilterChange(null);
      return;
    }

    onDepositFilterChange(Number(value));
  };

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_220px]">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por producto o usuario"
          className="pl-9"
        />
      </div>

      <Select value={filter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-full">
          <SelectValue>{filterLabels[filter]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.entries(filterLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={depositFilter ? String(depositFilter) : "ALL"}
        onValueChange={handleDepositChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {depositFilter
              ? deposits.find((deposit) => deposit.idDeposit === depositFilter)
                  ?.name ?? "Deposito"
              : "Todos los depositos"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">Todos los depositos</SelectItem>
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
  );
};
