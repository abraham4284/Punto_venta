import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Printer, ShoppingCart } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { ViewLoadingState } from "@/components/loading/ViewLoadingState";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { getOrderRequest, cancelOrderRequest, changeOrderStatusRequest } from "../api/orders.api";
import { useOrderDetails } from "../hooks/useOrders";
import { useOrderLookups } from "../hooks/useOrderLookups";
import { cancellableOrder, editableOrder, nextOrderStep, orderDate, orderMoney, orderRequestError } from "../helpers/orders.helpers";
import { OrderErrorNotice, OrderSection, OrderStatusBadge } from "../components/OrderUi";
import { OrderTimeline } from "../components/OrderTimeline";
import { OrderActionDialog } from "../components/OrderActionDialog";

import { OrderPrintView } from "../components/OrderPrintDocument";

import { OrderConversionDialog } from "../components/OrderConversionDialog";
import { OrderLinkedSale } from "../components/OrderLinkedSale";

type Action = { kind: "cancel"; label: string } | ({ kind: "status" } & NonNullable<ReturnType<typeof nextOrderStep>>);
const OrderDetailContent = ({ id }: { id: number }) => {
  const { order, events, loading, error, eventsError, reload, replaceOrder } = useOrderDetails(id);
  const lookups = useOrderLookups(); const navigate = useNavigate();
  const canView = useCan("orders.view");
  const canConvert = useCan("orders.convert"), canCreateSale = useCan("sales.create"), canViewSale = useCan("sales.view");
  const [conversionOpen, setConversionOpen] = useState(false);
  const canEdit = useCan("orders.update"), canStatus = useCan("orders.change_status"), canCancel = useCan("orders.cancel");
  const [action, setAction] = useState<Action | null>(null); const [busy, setBusy] = useState(false); const [actionError, setActionError] = useState<string | null>(null);
  const locked = useRef(false);
  const perform = async (reason: string) => {
    if (!action || locked.current) return;
    locked.current = true; setBusy(true); setActionError(null);
    try {
      const response = action.kind === "cancel" ? await cancelOrderRequest(id, reason) : await changeOrderStatusRequest(id, action.status);
      replaceOrder(response.data.data);
      setAction(null); toast.success("Pedido actualizado"); await reload();
    } catch (cause) {
      const failure = orderRequestError(cause); setActionError(failure.errors.find((issue) => issue.field === "reason")?.message || failure.message);
      if (failure.status === 409) { if (action.kind === "status") setAction(null); toast.error(failure.message); await reload(); }
    } finally { locked.current = false; setBusy(false); }
  };
  if (loading && !order) return <ViewLoadingState message="Cargando detalle del pedido" />;
  if (!order) return <OrderErrorNotice message={error?.message || "Pedido no disponible."} retry={() => void reload()} />;
  const step = nextOrderStep(order.status);
  const deposit = lookups.deposits.find((item) => item.idDeposit === order.idDeposit);
  const method = lookups.paymentMethods.find((item) => item.idPaymentMethod === order.expectedPaymentMethodId);
  const customer = order.customerSnapshot;
  return <div className="space-y-5" aria-busy={busy || loading}>
    {error && <OrderErrorNotice message={error.message} retry={() => void reload()} />}
    {lookups.error && <OrderErrorNotice message={`No se pudieron resolver algunos nombres. ${lookups.error}`} retry={() => void lookups.reload()} />}
    <OrderSection title="Pedido"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 space-y-2"><p className="break-all text-xl font-semibold">{order.orderNumber}</p><OrderStatusBadge status={order.status} /><p className="text-sm text-muted-foreground">Creado: {orderDate(order.createdAt)} · {order.fulfillmentType === "PICKUP" ? "Retiro" : "Entrega"}</p></div><div className="flex flex-wrap gap-2">{order.status === "READY" && canConvert && canCreateSale && <Button disabled={busy || loading || Boolean(error)} onClick={() => setConversionOpen(true)}><ShoppingCart className="size-4" />Convertir a venta</Button>}{canView && <Button variant="outline" disabled={busy || loading || Boolean(error) || lookups.loading} onClick={() => window.print()}><Printer className="size-4" />Imprimir pedido</Button>}{canEdit && editableOrder(order.status) && <Button variant="outline" disabled={busy || loading || Boolean(error)} onClick={() => navigate(`/admin/orders/${id}/edit`)}><Pencil className="size-4" />Editar pedido</Button>}{canStatus && step && <Button disabled={busy || loading || Boolean(error)} onClick={() => { setActionError(null); setAction({ kind: "status", ...step }); }}>{step.label}</Button>}{canCancel && cancellableOrder(order.status) && <Button variant="destructive" disabled={busy || loading || Boolean(error)} onClick={() => { setActionError(null); setAction({ kind: "cancel", label: "Cancelar pedido" }); }}>Cancelar pedido</Button>}</div></div>{order.status === "READY" && <p className="text-sm text-muted-foreground">Pedido listo para la siguiente etapa operativa.</p>}{order.cancellationReason && <p className="break-words rounded-lg bg-muted p-3 text-sm">Motivo de cancelación: {order.cancellationReason}</p>}{loading && <p role="status" className="text-sm">Actualizando información…</p>}</OrderSection>
    <OrderLinkedSale order={order} canViewSale={canViewSale} />
    <div className="grid gap-5 lg:grid-cols-2"><OrderSection title="Cliente al momento del pedido"><div className="space-y-2 break-words text-sm"><p className="font-semibold">{customer.fullName}</p><p>{customer.documentNumber ? `${customer.documentType} ${customer.documentNumber}` : "Sin documento"}</p>{customer.phone && <p>Teléfono: {customer.phone}</p>}{customer.email && <p>Email: {customer.email}</p>}{customer.address && <p>Dirección: {customer.address}</p>}</div></OrderSection><OrderSection title="Operación"><dl className="space-y-2 break-words text-sm"><div><dt className="text-muted-foreground">Depósito</dt><dd>{deposit?.name || (lookups.loading ? "Cargando nombre…" : "Nombre no disponible")}</dd></div><div><dt className="text-muted-foreground">Método de pago esperado</dt><dd>{order.expectedPaymentMethodId ? method?.name || (lookups.loading ? "Cargando nombre…" : "Nombre no disponible") : "Sin especificar"}</dd></div><div><dt className="text-muted-foreground">Observación</dt><dd className="whitespace-pre-wrap">{order.observation || "Sin observaciones"}</dd></div></dl></OrderSection></div>
    {order.fulfillmentType === "DELIVERY" && order.delivery && <OrderSection title="Entrega"><dl className="grid gap-3 text-sm sm:grid-cols-2">{[["Destinatario", order.delivery.recipientName], ["Teléfono", order.delivery.recipientPhone], ["Dirección", order.delivery.address], ["Referencia", order.delivery.reference || "Sin referencia"], ["Costo de entrega", orderMoney(order.deliveryFee)]].map(([label, value]) => <div className="min-w-0 break-words" key={label}><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}</dl></OrderSection>}
    <OrderSection title="Productos solicitados"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">Líneas históricas del pedido</caption><thead className="border-b text-xs text-muted-foreground"><tr>{["Producto", "Cantidad", "Precio unitario", "Descuento", "Total"].map((label) => <th scope="col" className="px-3 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{order.items.map((item) => <tr key={item.idOrderDetail} className="border-b last:border-0"><td className="max-w-72 break-words px-3 py-3"><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.barcode || "Sin código"} · {item.unitType}{item.saleMode === "on_order" ? " · Por encargo" : ""}</p></td><td className="px-3 py-3">{item.quantity}</td><td className="px-3 py-3">{orderMoney(item.unitPrice)}</td><td className="px-3 py-3">{orderMoney(item.discount)}</td><td className="px-3 py-3">{orderMoney(item.total)}</td></tr>)}</tbody></table></div><dl className="ml-auto max-w-sm space-y-2 pt-3 text-sm">{[["Subtotal", order.subtotal], ["Descuentos", order.discountTotal], ["Entrega", order.deliveryFee], ["Total del pedido", order.total]].map(([label, value]) => <div className="flex justify-between gap-4 border-b py-2" key={String(label)}><dt>{label}</dt><dd className="font-semibold">{orderMoney(Number(value))}</dd></div>)}</dl></OrderSection>
    <OrderSection title="Historial del pedido">{eventsError ? <OrderErrorNotice message={eventsError} retry={() => void reload()} /> : <OrderTimeline events={events} />}</OrderSection>
    {conversionOpen && <OrderConversionDialog order={order} depositName={deposit?.name || "Nombre no disponible"} onClose={() => setConversionOpen(false)} onRefresh={async () => { const response = await getOrderRequest(id); replaceOrder(response.data.data); reload(); return response.data.data; }} onSaved={(result) => { replaceOrder(result.order); setConversionOpen(false); toast.success("Pedido convertido a venta"); reload(); }} />}
    {canView && <OrderPrintView order={order} depositName={deposit?.name || "Nombre no disponible"} />}
    {action && <OrderActionDialog key={action.kind} cancel={action.kind === "cancel"} label={action.label} busy={busy} error={actionError} onClose={() => setAction(null)} onConfirm={(reason) => void perform(reason)} />}
  </div>;
};
export const OrderDetailPage = () => {
  const { idOrder } = useParams(); const navigate = useNavigate();
  return <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6"><Meta title="Detalle del pedido" /><header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Detalle del pedido</h1><Button variant="outline" onClick={() => navigate("/admin/orders")}><ArrowLeft className="size-4" />Pedidos</Button></header><OrderDetailContent key={idOrder} id={Number(idOrder)} /></main>;
};
