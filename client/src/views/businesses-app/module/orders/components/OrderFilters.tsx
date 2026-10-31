import { useState } from "react";
import { useForm } from "@/hooks/useForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderStatusLabels } from "../helpers/orders.helpers";
import type { OrderFilters as Filters, OrderStatus } from "../types/orders.types";
import type { useOrderLookups } from "../hooks/useOrderLookups";
import { OrderField } from "./OrderUi";

export const OrderFilters = ({ lookups, onApply }: { lookups: ReturnType<typeof useOrderLookups>; onApply: (filters: Filters) => void }) => {
  const initial = { search: "", status: "", idCustomer: "", idDeposit: "", fulfillmentType: "", dateFrom: "", dateTo: "", limit: "20" };
  const { formSate: draft, setFormSate } = useForm(initial);
  const [error, setError] = useState("");
  const set = (key: keyof typeof initial, value: string) => setFormSate((current) => ({ ...current, [key]: value }));
  const control = "h-9 w-full rounded-lg border bg-background px-2 text-sm";
  return <form className="space-y-4 rounded-xl border bg-card p-4" onSubmit={(event) => {
    event.preventDefault();
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) { setError("La fecha final debe ser igual o posterior a la inicial."); return; }
    setError(""); onApply({ page: 1, limit: Number(draft.limit), search: draft.search.trim() || undefined,
      status: draft.status ? draft.status as OrderStatus : undefined, idCustomer: draft.idCustomer ? Number(draft.idCustomer) : undefined,
      idDeposit: draft.idDeposit ? Number(draft.idDeposit) : undefined, fulfillmentType: draft.fulfillmentType ? draft.fulfillmentType as "PICKUP" | "DELIVERY" : undefined,
      dateFrom: draft.dateFrom || undefined, dateTo: draft.dateTo || undefined });
  }}>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <OrderField label="Número o cliente"><Input value={draft.search} maxLength={160} placeholder="Buscar pedidos" onChange={(e) => set("search", e.target.value)} /></OrderField>
      <OrderField label="Estado"><select className={control} value={draft.status} onChange={(e) => set("status", e.target.value)}><option value="">Todos</option>{Object.entries(orderStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></OrderField>
      <OrderField label="Cliente"><select className={control} value={draft.idCustomer} onChange={(e) => set("idCustomer", e.target.value)}><option value="">Todos</option>{lookups.customers.map((customer) => <option key={customer.idCustomer} value={customer.idCustomer}>{customer.fullName}</option>)}</select></OrderField>
      <OrderField label="Depósito"><select className={control} value={draft.idDeposit} onChange={(e) => set("idDeposit", e.target.value)}><option value="">Todos</option>{lookups.deposits.map((deposit) => <option key={deposit.idDeposit} value={deposit.idDeposit}>{deposit.name}</option>)}</select></OrderField>
      <OrderField label="Modalidad"><select className={control} value={draft.fulfillmentType} onChange={(e) => set("fulfillmentType", e.target.value)}><option value="">Todas</option><option value="PICKUP">Retiro</option><option value="DELIVERY">Entrega</option></select></OrderField>
      <OrderField label="Desde"><Input type="date" value={draft.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} /></OrderField>
      <OrderField label="Hasta"><Input type="date" value={draft.dateTo} onChange={(e) => set("dateTo", e.target.value)} /></OrderField>
      <OrderField label="Resultados por página"><select className={control} value={draft.limit} onChange={(e) => set("limit", e.target.value)}>{[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select></OrderField>
    </div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit">Aplicar filtros</Button><Button type="button" variant="outline" onClick={() => { setFormSate(initial); setError(""); onApply({ page: 1, limit: 20 }); }}>Limpiar filtros</Button></div>
  </form>;
};
