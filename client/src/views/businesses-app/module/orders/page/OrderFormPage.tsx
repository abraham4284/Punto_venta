import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { ViewLoadingState } from "@/components/loading/ViewLoadingState";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { useOrderDetails } from "../hooks/useOrders";
import { OrderForm } from "../components/OrderForm";
import { OrderErrorNotice, OrderStatusBadge } from "../components/OrderUi";
import { editableOrder } from "../helpers/orders.helpers";
import type { Order } from "../types/orders.types";

export const NewOrderPage = () => {
  const navigate = useNavigate(); const canView = useCan("orders.view");
  const [saved, setSaved] = useState<Order | null>(null); const [version, setVersion] = useState(0);
  return <main className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6"><Meta title="Nuevo pedido" /><header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Nuevo pedido</h1>{canView && <Button variant="outline" onClick={() => navigate("/admin/orders")}><ArrowLeft className="size-4" />Pedidos</Button>}</header>
    {saved ? <section role="status" className="space-y-5 rounded-xl border bg-card p-6"><CheckCircle2 className="size-10 text-emerald-600" /><h2 className="text-xl font-semibold">Pedido registrado</h2><p className="break-all font-medium">{saved.orderNumber}</p><OrderStatusBadge status={saved.status} /><div className="flex flex-wrap gap-2">{canView && <Button onClick={() => navigate(`/admin/orders/${saved.idOrder}`)}>Ver pedido</Button>}<Button variant="outline" onClick={() => { setSaved(null); setVersion((n) => n + 1); }}>Nuevo pedido</Button>{canView && <Button variant="ghost" onClick={() => navigate("/admin/orders")}>Ir a pedidos</Button>}</div></section> : <OrderForm key={version} onSaved={setSaved} />}
  </main>;
};

const EditOrderContent = ({ id }: { id: number }) => {
  const { order, loading, error, reload } = useOrderDetails(id, false);
  const navigate = useNavigate();
  if (loading && !order) return <ViewLoadingState message="Cargando pedido para editar" />;
  if (error) return <OrderErrorNotice message={error.message} retry={() => void reload()} />;
  if (!order) return <p>Pedido no disponible.</p>;
  if (!editableOrder(order.status)) return <section className="space-y-3 rounded-xl border p-6"><OrderStatusBadge status={order.status} /><p>Este pedido ya no admite edición.</p><Button variant="outline" onClick={() => navigate(`/admin/orders/${id}`)}>Ver pedido</Button></section>;
  return <OrderForm key={order.idOrder} initial={order} onSaved={() => navigate(`/admin/orders/${id}`, { replace: true })} />;
};
export const EditOrderPage = () => {
  const { idOrder } = useParams(); const navigate = useNavigate();
  return <main className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6"><Meta title="Editar pedido" /><header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Editar pedido</h1><Button variant="outline" onClick={() => navigate(`/admin/orders/${idOrder}`)}><ArrowLeft className="size-4" />Volver al pedido</Button></header><EditOrderContent key={idOrder} id={Number(idOrder)} /></main>;
};
