import { useMemo, useState } from "react";
import { FilterX } from "lucide-react";
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
import { paymentMethodTypeLabels } from "../../../payment-methods/helpers/payment-method.helpers";
import type { PaymentMethodResponse } from "../../../payment-methods/types";
import { SearchBox } from "../search/SearchBox";
import type {
  SaleDeliveryFilter,
  SaleFilters as SaleFiltersState,
  SalePaymentAggregateStatus,
  SaleSettlementFilter,
} from "../../types";

type Props = {
  filters: SaleFiltersState;
  deposits: DepositResponse[];
  paymentMethods: PaymentMethodResponse[];
  onChange: (filters: Partial<SaleFiltersState>) => void;
  onReset: () => void;
};

export const SaleFilters = ({
  filters,
  deposits,
  paymentMethods,
  onChange,
  onReset,
}: Props) => {
  const [depositSearch, setDepositSearch] = useState("");
  const [paymentMethodSearch, setPaymentMethodSearch] = useState("");
  const filteredDeposits = useMemo(() => {
    const value = depositSearch.trim().toLowerCase();
    const activeDeposits = deposits.filter((deposit) => deposit.isActive);

    if (!value) return activeDeposits.slice(0, 8);

    return activeDeposits
      .filter((deposit) => deposit.name.toLowerCase().includes(value))
      .slice(0, 8);
  }, [depositSearch, deposits]);

  const filteredPaymentMethods = useMemo(() => {
    const value = paymentMethodSearch.trim().toLowerCase();
    const activePaymentMethods = paymentMethods.filter((paymentMethod) => {
      return paymentMethod.isActive;
    });

    if (!value) return activePaymentMethods.slice(0, 8);

    return activePaymentMethods
      .filter((paymentMethod) => {
        const label = paymentMethodTypeLabels[paymentMethod.code];
        return (
          paymentMethod.name.toLowerCase().includes(value) ||
          label.toLowerCase().includes(value)
        );
      })
      .slice(0, 8);
  }, [paymentMethodSearch, paymentMethods]);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold">Filtros operativos</p>
          <p className="text-sm text-muted-foreground">
            Buscá ventas por número, estado de cobro, entrega, rendición, origen
            y método de pago.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDepositSearch("");
            setPaymentMethodSearch("");
            onReset();
          }}
        >
          <FilterX className="mr-2 size-4" />
          Limpiar filtros
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="grid gap-2">
          <Label>N venta</Label>
          <Input
            value={filters.saleNumber}
            onChange={(event) => onChange({ saleNumber: event.target.value })}
            placeholder="Ej: VTA-20260707"
          />
        </div>

        <div className="grid gap-2">
          <Label>Fecha desde</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label>Fecha hasta</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange({ endDate: event.target.value })}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-2">
          <Label>Estado venta</Label>
          <Select
            value={filters.status ?? "ALL"}
            onValueChange={(value: string | null) =>
              onChange({
                status:
                  value === "ALL" || !value
                    ? null
                    : (value as "COMPLETED" | "CANCELLED"),
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
          <Label>Estado de cobro</Label>
          <Select
            value={filters.paymentStatus ?? "ALL"}
            onValueChange={(value: string | null) =>
              onChange({
                paymentStatus:
                  value === "ALL" || !value
                    ? null
                    : (value as SalePaymentAggregateStatus),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="UNPAID">Pendiente</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Pago parcial</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Estado de entrega</Label>
          <Select
            value={filters.deliveryStatus ?? "ALL"}
            onValueChange={(value: string | null) =>
              onChange({
                deliveryStatus:
                  value === "ALL" || !value
                    ? null
                    : (value as SaleDeliveryFilter),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="NO_DELIVERY">Sin entrega</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="ASSIGNED">Asignada</SelectItem>
                <SelectItem value="OUT_FOR_DELIVERY">En camino</SelectItem>
                <SelectItem value="DELIVERED">Entregada</SelectItem>
                <SelectItem value="FAILED">Fallida</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Rendición</Label>
          <Select
            value={filters.settlementStatus ?? "ALL"}
            onValueChange={(value: string | null) =>
              onChange({
                settlementStatus:
                  value === "ALL" || !value
                    ? null
                    : (value as SaleSettlementFilter),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="PENDING_SETTLEMENT">
                  Con efectivo por rendir
                </SelectItem>
                <SelectItem value="NO_PENDING_SETTLEMENT">
                  Sin efectivo por rendir
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SearchBox
          label="Depósito"
          value={depositSearch}
          placeholder="Buscar depósito..."
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

        <SearchBox
          label="Método de pago"
          value={paymentMethodSearch}
          placeholder="Buscar método..."
          options={filteredPaymentMethods}
          getKey={(paymentMethod) => paymentMethod.idPaymentMethod}
          getLabel={(paymentMethod) =>
            `${paymentMethod.name} · ${paymentMethodTypeLabels[paymentMethod.code]}`
          }
          onSearchChange={(value) => {
            setPaymentMethodSearch(value);
            onChange({ idPaymentMethod: null });
          }}
          onSelect={(paymentMethod) => {
            setPaymentMethodSearch(paymentMethod.name);
            onChange({ idPaymentMethod: paymentMethod.idPaymentMethod });
          }}
        />
      </section>
    </div>
  );
};
