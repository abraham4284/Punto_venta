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

type Props = {
  search: string;
  filter: StockMovementFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: StockMovementFilter) => void;
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
  onSearchChange,
  onFilterChange,
}: Props) => {
  const handleFilterChange = (value: string | null) => {
    if (!value) return;

    onFilterChange(value as StockMovementFilter);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por producto o usuario"
          className="pl-9"
        />
      </div>

      <Select value={filter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-full md:w-52">
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
    </div>
  );
};
