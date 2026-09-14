import { useMemo, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Customer } from "../../../customers/types/customers.types";

type Props = {
  isOpen: boolean;
  customers: Customer[];
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onClear: () => void;
};

export const CustomerSelectionModal = ({
  isOpen,
  customers,
  onClose,
  onSelect,
  onClear,
}: Props) => {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();
    const activeCustomers = customers.filter((customer) => customer.isActive);

    if (!value) return activeCustomers.slice(0, 40);

    return activeCustomers
      .filter((customer) => {
        return (
          customer.name.toLowerCase().includes(value) ||
          customer.email?.toLowerCase().includes(value) ||
          customer.phone?.toLowerCase().includes(value)
        );
      })
      .slice(0, 40);
  }, [customers, search]);

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar cliente</DialogTitle>
          <DialogDescription>
            Buscá por nombre, teléfono o correo. También podés registrar la
            venta como consumidor final.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9"
              autoFocus
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              onClear();
              handleClose();
            }}
          >
            <X className="mr-2 size-4" />
            Consumidor final
          </Button>

          <div className="max-h-[54vh] space-y-2 overflow-y-auto pr-1">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.idCustomer}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
                  onClick={() => {
                    onSelect(customer);
                    handleClose();
                  }}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{customer.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {customer.phone || "Sin teléfono"} ·{" "}
                      {customer.email || "Sin correo"}
                    </p>
                    {customer.address ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.address}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No se encontraron clientes activos.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
