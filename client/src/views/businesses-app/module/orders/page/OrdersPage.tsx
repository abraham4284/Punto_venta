import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { ViewLoadingState } from "@/components/loading/ViewLoadingState";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { useOrders } from "../hooks/useOrders";
import { useOrderLookups } from "../hooks/useOrderLookups";
import { OrderFilters } from "../components/OrderFilters";
import { OrderErrorNotice, OrdersPager, OrderStatusBadge } from "../components/OrderUi";
import { editableOrder, orderDate, orderMoney } from "../helpers/orders.helpers";
import type { OrderFilters as Filters } from "../types/orders.types";

export const OrdersPage = () => {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });
  const { data, loading, error, reload } = useOrders(filters);
  const lookups = useOrderLookups(true);
  const canCreate = useCan("orders.create"), canEdit = useCan("orders.update");
  const navigate = useNavigate();
  return <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6"><Meta title="Pedidos" />
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-semibold"><ClipboardList className="size-6" />Pedidos</h1><p className="mt-1 text-sm text-muted-foreground">Seguimiento y preparación de pedidos del negocio.</p></div>{canCreate && <Button onClick={() => navigate("/admin/orders/new")}><Plus className="size-4" />Nuevo pedido</Button>}</header>
    <OrderFilters lookups={lookups} onApply={setFilters} />
    {lookups.error && <OrderErrorNotice message={`Algunos filtros no están disponibles. ${lookups.error}`} retry={() => void lookups.reload()} />}
    {error && <OrderErrorNotice message={error.message} retry={reload} />}
    {data && <section aria-label="Métricas del conjunto filtrado" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{([
      ["Pedidos", data.metrics.total], ["Pendientes", data.metrics.pending], ["Confirmados", data.metrics.confirmed], ["Preparando", data.metrics.preparing], ["Listos", data.metrics.ready], ["Cancelados", data.metrics.cancelled],
    ] as const).map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</section>}
    {data && <p className="text-sm text-muted-foreground">Monto de pedidos del conjunto filtrado: <strong className="text-foreground">{orderMoney(data.metrics.totalAmount)}</strong></p>}
    {loading && !data ? <ViewLoadingState message="Cargando pedidos" /> : data && <section className="rounded-xl border bg-card p-4" aria-busy={loading}>
      {loading && <p role="status" className="pb-3 text-sm text-muted-foreground">Actualizando pedidos…</p>}
      {data.orders.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No hay pedidos para estos filtros.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><caption className="sr-only">Pedidos del conjunto filtrado</caption><thead className="border-b text-xs text-muted-foreground"><tr>{["Número", "Fecha", "Cliente", "Modalidad", "Estado", "Total", "Acciones"].map((label) => <th scope="col" className="px-3 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{data.orders.map((order) => <tr className="border-b last:border-0" key={order.idOrder}><td className="max-w-52 break-words px-3 py-4 font-medium">{order.orderNumber}</td><td className="px-3 py-4">{orderDate(order.createdAt)}</td><td className="max-w-52 break-words px-3 py-4">{order.customerSnapshot.fullName}</td><td className="px-3 py-4">{order.fulfillmentType === "PICKUP" ? "Retiro" : "Entrega"}</td><td className="px-3 py-4"><OrderStatusBadge status={order.status} /></td><td className="whitespace-nowrap px-3 py-4">{orderMoney(order.total)}</td><td className="px-3 py-4"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => navigate(`/admin/orders/${order.idOrder}`)}>Ver pedido</Button>{canEdit && editableOrder(order.status) && <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/orders/${order.idOrder}/edit`)}>Editar</Button>}</div></td></tr>)}</tbody></table></div>}
      <OrdersPager pagination={data.pagination} disabled={loading} onPage={(page) => setFilters((current) => ({ ...current, page }))} />
    </section>}
  </main>;
};
