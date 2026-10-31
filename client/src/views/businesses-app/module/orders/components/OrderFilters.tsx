import { useState } from "react";
import { useForm } from "@/hooks/useForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderStatusLabels } from "../helpers/orders.helpers";
import type { OrderFilters as Filters, OrderStatus } from "../types/orders.types";
import type { useOrderLookups } from "../hooks/useOrderLookups";
import { OrderField } from "./OrderUi";
import { OrderSelect } from "./OrderSelect";

export const OrderFilters = ({ lookups, onApply }: { lookups: ReturnType<typeof useOrderLookups>; onApply: (filters: Filters) => void }) => {
  const initial = { search: "", status: "", idCustomer: "", idDeposit: "", fulfillmentType: "", dateFrom: "", dateTo: "", limit: "20" };
  const { formSate: draft, setFormSate } = useForm(initial);
  const [error, setError] = useState("");
  const set = (key: keyof typeof initial, value: string) => setFormSate((current) => ({ ...current, [key]: value }));
  return <form className="space-y-4 rounded-xl border bg-card p-4" onSubmit={(event) => {
    event.preventDefault();
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) { setError("La fecha final debe ser igual o posterior a la inicial."); return; }
    setError(""); onApply({ page: 1, limit: Number(draft.limit), search: draft.search.trim() || undefined,
      status: draft.status ? draft.status as OrderStatus : undefined, idCustomer: draft.idCustomer ? Number(draft.idCustomer) : undefined,
      idDeposit: draft.idDeposit ? Number(draft.idDeposit) : undefined, fulfillmentType: draft.fulfillmentType ? draft.fulfillmentType as "PICKUP" | "DELIVERY" : undefined,
      dateFrom: draft.dateFrom || undefined, dateTo: draft.dateTo || undefined });
  }}>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <OrderField label="Número o cliente"><Input className="h-11" value={draft.search} maxLength={160} placeholder="Buscar pedidos" onChange={(event) => set("search", event.target.value)} /></OrderField>
      <OrderSelect id="orders-filter-status" label="Estado" value={draft.status} options={[{ value: "", label: "Todos" }, ...Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }))]} onChange={(value) => set("status", value)} />
      <OrderSelect id="orders-filter-customer" label="Cliente" value={draft.idCustomer} options={[{ value: "", label: "Todos" }, ...lookups.customers.map((item) => ({ value: String(item.idCustomer), label: item.fullName }))]} onChange={(value) => set("idCustomer", value)} />
      <OrderSelect id="orders-filter-deposit" label="Depósito" value={draft.idDeposit} options={[{ value: "", label: "Todos" }, ...lookups.deposits.map((item) => ({ value: String(item.idDeposit), label: item.name }))]} onChange={(value) => set("idDeposit", value)} />
      <OrderSelect id="orders-filter-mode" label="Modalidad" value={draft.fulfillmentType} options={[{ value: "", label: "Todas" }, { value: "PICKUP", label: "Retiro" }, { value: "DELIVERY", label: "Entrega" }]} onChange={(value) => set("fulfillmentType", value)} />
      <OrderField label="Desde"><Input className="h-11" type="date" value={draft.dateFrom} onChange={(event) => set("dateFrom", event.target.value)} /></OrderField>
      <OrderField label="Hasta"><Input className="h-11" type="date" value={draft.dateTo} onChange={(event) => set("dateTo", event.target.value)} /></OrderField>
      <OrderSelect id="orders-filter-limit" label="Resultados por página" value={draft.limit} options={[10, 20, 50, 100].map((n) => ({ value: String(n), label: String(n) }))} onChange={(value) => set("limit", value)} />
    </div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit">Aplicar filtros</Button><Button type="button" variant="outline" onClick={() => { setFormSate(initial); setError(""); onApply({ page: 1, limit: 20 }); }}>Limpiar filtros</Button></div>
  </form>;
};
