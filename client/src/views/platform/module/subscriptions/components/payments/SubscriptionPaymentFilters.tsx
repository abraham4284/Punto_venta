import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Filter, Search, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type {
  BusinessOption,
  BusinessSubscription,
  SubscriptionPaymentFilters as PaymentFilters,
} from "../../types/subscriptions.types";

interface SearchableOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableFilterSelectProps {
  label: string;
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
}

interface SubscriptionPaymentFilterPanelProps {
  filters: PaymentFilters;
  businesses: BusinessOption[];
  subscriptions: BusinessSubscription[];
  onChange: (filters: PaymentFilters) => void;
  onApply: (filters: PaymentFilters) => void;
  onClear: () => void;
}

const getSubscriptionLabel = (subscription: BusinessSubscription) => {
  return `${subscription.business.name} - ${subscription.plan.name}`;
};

const SearchableFilterSelect = ({
  label,
  value,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  options,
  onChange,
}: SearchableFilterSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) ?? null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) return options;

    return options.filter((option) => {
      return `${option.label} ${option.description ?? ""}`
        .toLowerCase()
        .includes(cleanSearch);
    });
  }, [options, search]);

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="relative space-y-2">
      <Label>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full justify-between px-3 font-normal"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span
          className={cn(
            "truncate text-left",
            !selectedOption && "text-muted-foreground",
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
              autoFocus
            />
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => selectOption("")}
            >
              <span>Todos</span>
              {!value && <Check className="size-4" />}
            </button>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => selectOption(option.value)}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {value === option.value && <Check className="size-4 shrink-0" />}
                </button>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SubscriptionPaymentFilterPanel = ({
  filters,
  businesses,
  subscriptions,
  onChange,
  onApply,
  onClear,
}: SubscriptionPaymentFilterPanelProps) => {
  const businessOptions = useMemo(() => {
    return businesses.map((business) => ({
      value: String(business.idBusiness),
      label: business.name,
      description: business.slug,
    }));
  }, [businesses]);

  const subscriptionOptions = useMemo(() => {
    return subscriptions
      .filter((subscription) => {
        if (!filters.idBusiness) return true;
        return String(subscription.business.idBusiness) === filters.idBusiness;
      })
      .map((subscription) => ({
        value: String(subscription.idBusinessSubscription),
        label: getSubscriptionLabel(subscription),
        description: `${subscription.status} - ${subscription.plan.billingPeriod}`,
      }));
  }, [filters.idBusiness, subscriptions]);

  const updateBusiness = (idBusiness: string) => {
    const selectedSubscription = subscriptions.find((subscription) => {
      return (
        String(subscription.idBusinessSubscription) ===
        filters.idBusinessSubscription
      );
    });
    const shouldClearSubscription =
      idBusiness &&
      selectedSubscription &&
      String(selectedSubscription.business.idBusiness) !== idBusiness;

    onChange({
      ...filters,
      idBusiness,
      idBusinessSubscription: shouldClearSubscription
        ? ""
        : filters.idBusinessSubscription,
    });
  };

  const updateSubscription = (idBusinessSubscription: string) => {
    const selectedSubscription = subscriptions.find((subscription) => {
      return String(subscription.idBusinessSubscription) === idBusinessSubscription;
    });

    onChange({
      ...filters,
      idBusinessSubscription,
      idBusiness: selectedSubscription
        ? String(selectedSubscription.business.idBusiness)
        : filters.idBusiness,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchableFilterSelect
          label="Negocio"
          value={filters.idBusiness}
          placeholder="Todos los negocios"
          searchPlaceholder="Buscar negocio..."
          emptyMessage="No se encontraron negocios"
          options={businessOptions}
          onChange={updateBusiness}
        />
        <SearchableFilterSelect
          label="Suscripcion"
          value={filters.idBusinessSubscription}
          placeholder="Todas las suscripciones"
          searchPlaceholder="Buscar suscripcion..."
          emptyMessage="No se encontraron suscripciones"
          options={subscriptionOptions}
          onChange={updateSubscription}
        />
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => {
              if (!value) return;
              onChange({
                ...filters,
                status: value as PaymentFilters["status"],
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="APPROVED">Aprobados</SelectItem>
                <SelectItem value="REJECTED">Rechazados</SelectItem>
                <SelectItem value="CANCELLED">Cancelados</SelectItem>
                <SelectItem value="REFUNDED">Reembolsados</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Metodo</Label>
          <Select
            value={filters.paymentMethod}
            onValueChange={(value) => {
              if (!value) return;
              onChange({
                ...filters,
                paymentMethod: value as PaymentFilters["paymentMethod"],
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                <SelectItem value="CARD">Tarjeta</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row xl:pb-0">
        <Button type="button" variant="outline" onClick={onClear}>
          <X className="size-4" />
          Limpiar
        </Button>
        <Button type="button" onClick={() => onApply(filters)}>
          <Filter className="size-4" />
          Aplicar
        </Button>
      </div>
    </div>
  );
};
