import { useMemo, useState } from "react";
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
  SelectValue,
} from "@/components/ui/select";
import type { DepositResponse } from "../../../deposits/types/deposits.types";
import type {
  AdvancedStockAlertStatus,
  AdvancedStockFilters,
} from "../../types/stock.types";

type ApplicableFilters = Omit<AdvancedStockFilters, "page" | "limit">;

type Props = {
  filters: AdvancedStockFilters;
  deposits: DepositResponse[];
  loading: boolean;
  onApply: (filters: ApplicableFilters) => void;
};

type FilterFormState = {
  search: string;
  idDeposit: string;
  alertStatus: "ALL" | AdvancedStockAlertStatus;
  quantity: string;
  minQuantity: string;
  maxQuantity: string;
};

const initialForm: FilterFormState = {
  search: "",
  idDeposit: "ALL",
  alertStatus: "ALL",
  quantity: "",
  minQuantity: "",
  maxQuantity: "",
};

const alertStatusLabels: Record<FilterFormState["alertStatus"], string> = {
  ALL: "Todos",
  OK: "Stock optimo",
  LOW: "Bajo stock",
  ZERO: "Sin stock",
};

const numberOrNull = (value: string): number | null => {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const mapFiltersToForm = (filters: AdvancedStockFilters): FilterFormState => {
  return {
    search: filters.search,
    idDeposit: filters.idDeposit ? String(filters.idDeposit) : "ALL",
    alertStatus: filters.alertStatus ?? "ALL",
    quantity: filters.quantity === null ? "" : String(filters.quantity),
    minQuantity:
      filters.minQuantity === null ? "" : String(filters.minQuantity),
    maxQuantity:
      filters.maxQuantity === null ? "" : String(filters.maxQuantity),
  };
};

export const StockFilter = ({
  filters,
  deposits,
  loading,
  onApply,
}: Props) => {
  const [formState, setFormState] = useState<FilterFormState>(() =>
    mapFiltersToForm(filters),
  );

  const activeDeposits = useMemo(() => {
    return deposits.filter((deposit) => deposit.isActive);
  }, [deposits]);

  const selectedDepositName = useMemo(() => {
    if (formState.idDeposit === "ALL") return "Todos";

    return (
      activeDeposits.find((deposit) => {
        return String(deposit.idDeposit) === formState.idDeposit;
      })?.name ?? "Todos"
    );
  }, [activeDeposits, formState.idDeposit]);

  const handleApply = () => {
    onApply({
      search: formState.search.trim(),
      idDeposit:
        formState.idDeposit === "ALL" ? null : Number(formState.idDeposit),
      quantity: numberOrNull(formState.quantity),
      minQuantity: numberOrNull(formState.minQuantity),
      maxQuantity: numberOrNull(formState.maxQuantity),
      alertStatus:
        formState.alertStatus === "ALL" ? null : formState.alertStatus,
    });
  };

  const handleReset = () => {
    setFormState(initialForm);
    onApply({
      search: "",
      idDeposit: null,
      quantity: null,
      minQuantity: null,
      maxQuantity: null,
      alertStatus: null,
    });
  };

  return (
    <Card className="border-dashed bg-muted/20 shadow-none">
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto] lg:items-end">
        <div className="grid gap-2">
          <Label htmlFor="stock-search">Producto o codigo</Label>
          <Input
            id="stock-search"
            value={formState.search}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder="Buscar por nombre o codigo..."
          />
        </div>

        <div className="grid gap-2">
          <Label>Deposito</Label>
          <Select
            value={formState.idDeposit}
            onValueChange={(value) =>
              setFormState((current) => ({
                ...current,
                idDeposit: value ?? "ALL",
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos">{selectedDepositName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Todos</SelectItem>
                {activeDeposits.map((deposit) => (
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

        <div className="grid gap-2">
          <Label>Estado</Label>
          <Select
            value={formState.alertStatus}
            onValueChange={(value) =>
              setFormState((current) => ({
                ...current,
                alertStatus: (value ?? "ALL") as FilterFormState["alertStatus"],
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos">
                {alertStatusLabels[formState.alertStatus]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="OK">Stock optimo</SelectItem>
                <SelectItem value="LOW">Bajo stock</SelectItem>
                <SelectItem value="ZERO">Sin stock</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="stock-min">Stock minimo</Label>
          <Input
            id="stock-min"
            type="number"
            min="0"
            step="0.01"
            value={formState.minQuantity}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                minQuantity: event.target.value,
              }))
            }
            placeholder="0"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="stock-max">Stock maximo</Label>
          <Input
            id="stock-max"
            type="number"
            min="0"
            step="0.01"
            value={formState.maxQuantity}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                maxQuantity: event.target.value,
              }))
            }
            placeholder="100"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button type="button" disabled={loading} onClick={handleApply}>
            <Filter className="mr-2 h-4 w-4" />
            Aplicar Filtros
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
