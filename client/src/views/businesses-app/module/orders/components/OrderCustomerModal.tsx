import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Customer } from "../../customers/types/customers.types";
import { getCustomerDocumentLabel, matchesCustomerSearch } from "../../customers/helpers/customer.helpers";

export const OrderCustomerModal = ({ customers, onSelect, onClose }: {
  customers: Customer[]; onSelect: (customer: Customer) => void; onClose: () => void;
}) => {
  const [search, setSearch] = useState("");
  const matches = useMemo(() => customers.filter((customer) => customer.isActive && matchesCustomerSearch(customer, search)), [customers, search]);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar cliente del pedido</DialogTitle>
          <DialogDescription>Buscá por nombre, documento, teléfono o email. El pedido requiere un cliente.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus aria-label="Buscar cliente" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Nombre, documento, teléfono o email" />
        </div>
        <p className="text-xs text-muted-foreground">{matches.length} resultados{matches.length > 40 ? " · Mostrando 40; refiná la búsqueda para ver otros clientes." : ""}</p>
        <div className="max-h-[52vh] space-y-2 overflow-y-auto">
          {matches.slice(0, 40).map((customer) => (
            <button type="button" key={customer.idCustomer} onClick={() => { onSelect(customer); onClose(); }} className="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></span>
              <span className="min-w-0 space-y-1 break-words">
                <span className="block font-semibold">{customer.fullName}</span>
                <span className="block text-xs text-muted-foreground">{getCustomerDocumentLabel(customer)}</span>
                <span className="block text-sm text-muted-foreground">{customer.phone || "Sin teléfono"} · {customer.email || "Sin email"}</span>
              </span>
            </button>
          ))}
          {matches.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No se encontraron clientes activos.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};
