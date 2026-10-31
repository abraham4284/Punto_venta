import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { usePaymentMethods } from "../../payment-methods/hooks/usePaymentMethods";
import type { PaymentMethodResponse } from "../../payment-methods/types";
import { SalePaymentsSection } from "../../sales/components/create/SalePaymentsSection";
import { getDeliveryUsersForSaleRequest } from "../../sales/api/sales.api";
import type { DeliveryUserOption } from "../../sales/types";
import { useOrderConversion } from "../hooks/useOrderConversion";
import { orderMoney } from "../helpers/orders.helpers";
import type { ConvertOrderResult, Order } from "../types/orders.types";
import { OrderErrorNotice, OrderSection } from "./OrderUi";
import { OrderSelect } from "./OrderSelect";

type Props = { order: Order; depositName: string; onClose: () => void; onSaved: (result: ConvertOrderResult) => void; onRefresh: () => Promise<Order> };
type Resources = { methods: PaymentMethodResponse[]; users: DeliveryUserOption[]; loading: boolean; error: string | null; usersError: string | null; reload: () => void };

const OrderConversionCheckout = ({ order, depositName, onClose, onSaved, onRefresh, onProcessing, resources }: Props & { onProcessing: (busy: boolean) => void; resources: Resources }) => {
  const form = useOrderConversion(order, resources.methods, onSaved, onRefresh, onProcessing);
  const canViewCash = useCan("cash.view");
  const disabled = form.saving || form.checking || resources.loading;
  const delivery = order.fulfillmentType === "DELIVERY";
  const courierOptions = [{ value: "", label: "Sin asignar" }, ...resources.users.map((user) => ({ value: String(user.idUser), label: user.name }))];
  if (form.metadata.assignedToUserId && !courierOptions.some((option) => option.value === form.metadata.assignedToUserId)) courierOptions.push({ value: form.metadata.assignedToUserId, label: "Cadete seleccionado no disponible" });
  return <>
    <div className="min-h-0 space-y-4 overflow-y-auto px-1 pb-2" aria-busy={disabled}>
      <OrderSection title={`Pedido ${order.orderNumber}`}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {[["Cliente", order.customerSnapshot.fullName], ["Depósito", depositName], ["Modalidad", delivery ? "Entrega" : "Retiro"], ["Productos", `${order.items.length} líneas`], ["Subtotal", orderMoney(order.subtotal)], ["Descuentos", orderMoney(order.discountTotal)], ["Entrega", orderMoney(order.deliveryFee)], ["Total venta", orderMoney(order.total)]].map(([label, value]) => <div className="min-w-0 break-words" key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}
        </dl>
        <ul className="max-h-36 space-y-1 overflow-y-auto border-t pt-3 text-xs">{order.items.map((item) => <li className="break-words" key={item.idOrderDetail}>{item.quantity} {item.unitType} · {item.productName} · {orderMoney(item.total)}</li>)}</ul>
        {delivery && order.delivery && <div className="space-y-1 border-t pt-3 text-sm break-words"><p className="font-medium">Entrega del pedido</p><p>Destinatario: {order.delivery.recipientName}</p><p>Teléfono: {order.delivery.recipientPhone}</p><p>Dirección: {order.delivery.address}</p><p>Referencia: {order.delivery.reference || "Sin referencia"}</p></div>}
      </OrderSection>
      <OrderSection title="Caja actual">
        <p className="text-sm">{form.cash.loading ? "Consultando caja…" : form.cash.currentSession ? `${form.cash.currentSession.cashRegisterName} · Abierta` : "No hay una caja abierta disponible. Abrí una caja antes de convertir."}</p>
        {form.cash.error && <p role="alert" className="text-sm text-destructive">{form.cash.error}</p>}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" disabled={disabled || form.cash.loading} onClick={() => void form.cash.refreshCurrentSession()}>Actualizar caja</Button>{canViewCash && !form.saving && <Link to="/admin/cash" target="_blank" rel="noreferrer" className="self-center text-sm underline">Abrir Caja en otra pestaña</Link>}</div>
      </OrderSection>
      {resources.error && <OrderErrorNotice message={resources.error} />}
      {!resources.loading && resources.methods.length === 0 && <p role="alert" className="text-sm text-destructive">No hay métodos de pago activos disponibles. Actualizá los métodos antes de convertir.</p>}
      <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={resources.reload}>Actualizar métodos y cadetes</Button>
      <p className="text-xs text-muted-foreground">El método esperado es una sugerencia editable. Al confirmar se registrarán los pagos configurados abajo.</p>
      <SalePaymentsSection payments={form.payments} paymentMethods={resources.methods} paymentMethodsLoading={resources.loading} totals={form.totals} hasDelivery={delivery} disabled={disabled} errors={form.errors} onAddPayment={form.addPayment} onRemovePayment={form.removePayment} onPaymentChange={form.changePayment} />
      <p className="text-sm" role="status">Total venta: {orderMoney(form.totals.total)} · Asignado: {orderMoney(form.totals.assigned)} · Restante: {orderMoney(form.totals.pending)}</p>
      {delivery && <OrderSection title="Organización de la entrega (opcional)">
        {resources.usersError && <p role="alert" className="text-sm text-destructive">{resources.usersError} Podés continuar sin asignar cadete.</p>}
        <OrderSelect id="convert-order-courier" label="Cadete" value={form.metadata.assignedToUserId} error={form.errors["delivery.assignedToUserId"]} disabled={disabled} options={courierOptions} onChange={(value) => form.changeMetadata("assignedToUserId", value)} />
        <div className="space-y-2"><label htmlFor="convert-order-date" className="text-sm font-medium">Programación</label><Input id="convert-order-date" type="datetime-local" aria-invalid={Boolean(form.errors["delivery.scheduledAt"])} aria-describedby={form.errors["delivery.scheduledAt"] ? "convert-order-date-error" : undefined} disabled={disabled} value={form.metadata.scheduledAt} onChange={(event) => form.changeMetadata("scheduledAt", event.target.value)} />{form.errors["delivery.scheduledAt"] && <p id="convert-order-date-error" className="text-sm text-destructive">{form.errors["delivery.scheduledAt"]}</p>}</div>
        <div className="space-y-2"><label htmlFor="convert-order-note" className="text-sm font-medium">Observación de entrega</label><Textarea id="convert-order-note" aria-invalid={Boolean(form.errors["delivery.observation"])} aria-describedby={form.errors["delivery.observation"] ? "convert-order-note-error" : undefined} disabled={disabled} value={form.metadata.observation} maxLength={255} onChange={(event) => form.changeMetadata("observation", event.target.value)} />{form.errors["delivery.observation"] && <p id="convert-order-note-error" className="text-sm text-destructive">{form.errors["delivery.observation"]}</p>}</div>
      </OrderSection>}
      {form.error && <OrderErrorNotice message={form.error} />}
      {Object.keys(form.errors).length > 0 && <ul role="alert" className="list-inside list-disc text-sm text-destructive">{Object.entries(form.errors).map(([field, message]) => <li key={field}>{field.startsWith("payments.") ? `Pago ${Number(field.split(".")[1]) + 1}: ` : ""}{message}</li>)}</ul>}
      {(form.needsRefresh || form.checking) && <Button type="button" variant="outline" disabled={form.checking || form.saving} onClick={() => void form.refreshOrder()}>{form.checking ? "Actualizando pedido…" : "Actualizar pedido para reintentar"}</Button>}
      {order.status !== "READY" && <p role="alert" className="rounded-lg bg-muted p-3 text-sm">El pedido actualizado ya no está READY. Cerrá el checkout para revisar el estado y la venta vinculada.</p>}
      <p className="text-xs text-muted-foreground">La conversión registra una venta y descuenta stock. El backend valida caja, pagos y disponibilidad al confirmar.</p>
    </div>
    <DialogFooter className="m-0 flex-wrap rounded-lg p-3">
      <Button type="button" variant="outline" disabled={form.saving} onClick={onClose}>Cancelar</Button>
      <Button type="button" disabled={form.blocked || resources.loading || Boolean(resources.error)} onClick={() => void form.submit()}>{form.saving ? "Convirtiendo…" : "Confirmar conversión a venta"}</Button>
    </DialogFooter>
  </>;
};

export const OrderConversionDialog = (props: Props) => {
  const { activePaymentMethods, getPaymentMethods, loading, error } = usePaymentMethods();
  const [users, setUsers] = useState<DeliveryUserOption[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  const onProcessing = useCallback((value: boolean) => { busy.current = value; }, []);
  const delivery = props.order.fulfillmentType === "DELIVERY";
  useEffect(() => {
    let active = true;
    const load = async () => {
      setResourceLoading(true);
      const [, couriers] = await Promise.allSettled([getPaymentMethods(true), ...(delivery ? [getDeliveryUsersForSaleRequest()] : [])]);
      if (!active) return;
      if (couriers?.status === "fulfilled") { setUsers(couriers.value.data.data); setUsersError(null); }
      else if (couriers?.status === "rejected") setUsersError("No se pudieron cargar los cadetes.");
      setResourceLoading(false); setLoaded(true);
    };
    void load(); return () => { active = false; };
  }, [getPaymentMethods, delivery, revision]);
  return <Dialog open onOpenChange={(open) => { if (!open && !busy.current) props.onClose(); }}>
    <DialogContent showCloseButton={false} className="grid max-h-[92dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden sm:max-w-3xl">
      <DialogHeader><DialogTitle>Convertir pedido a venta</DialogTitle><DialogDescription>Revisá el pedido y configurá caja, pagos y entrega. Los datos del pedido son de solo lectura.</DialogDescription></DialogHeader>
      {loaded ? <OrderConversionCheckout {...props} onProcessing={onProcessing} resources={{ methods: activePaymentMethods, users, loading: loading || resourceLoading, error, usersError, reload: () => setRevision((n) => n + 1) }} /> : <><p role="status">Cargando datos del checkout…</p><Button type="button" variant="outline" onClick={props.onClose}>Cancelar</Button></>}
    </DialogContent>
  </Dialog>;
};
