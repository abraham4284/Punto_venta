import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { useOrderForm } from "../hooks/useOrderForm";
import { useOrderLookups } from "../hooks/useOrderLookups";
import { useOrderAvailability } from "../hooks/useOrderAvailability";
import { defaultOrderDeposit } from "../helpers/order-context.helpers";
import { orderMoney } from "../helpers/orders.helpers";
import type { Order } from "../types/orders.types";
import { OrderErrorNotice, OrderField, OrderSection } from "./OrderUi";
import { OrderProductPicker } from "./OrderProductPicker";
import { OrderCart } from "./OrderCart";
import { OrderContextSection } from "./OrderContextSection";
import { OrderDeliverySection } from "./OrderDeliverySection";

export const OrderForm = ({ initial, onSaved }: { initial?: Order; onSaved: (order: Order) => void }) => {
  const lookups = useOrderLookups(true);
  const form = useOrderForm(initial, onSaved, defaultOrderDeposit(lookups.deposits));
  const available = useOrderAvailability(form.draft.idDeposit, form.lines);
  const customer = lookups.customers.find((item) => String(item.idCustomer) === form.draft.idCustomer);
  const navigate = useNavigate();
  const canView = useCan("orders.view");
  const { draft, saving, fieldErrors } = form;
  return (
    <form noValidate className="space-y-5" onSubmit={(event) => { event.preventDefault(); void form.submit(); }} aria-busy={saving}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{lookups.loading ? "Cargando datos del negocio…" : "Definí el contexto y agregá los productos del pedido."}</p>
        <Button type="button" variant="ghost" size="sm" disabled={saving || lookups.loading} onClick={() => lookups.reload()}>Actualizar datos de selección</Button>
      </div>
      {lookups.error && <OrderErrorNotice message={lookups.error} retry={() => lookups.reload()} />}
      {form.error && <OrderErrorNotice message={`${form.error.message}${form.error.code ? ` (${form.error.code})` : ""}`} />}
      {Object.keys(fieldErrors).length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{Object.entries(fieldErrors).map(([field, message]) => <li key={field}>{field.startsWith("items.") ? `Línea ${Number(field.split(".")[1]) + 1}: ` : ""}{message}</li>)}</ul>}
      <OrderContextSection form={form} lookups={lookups} initial={initial} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <fieldset disabled={saving} className="min-w-0 space-y-5">
          <OrderSection title="Buscar productos"><OrderProductPicker key={draft.idDeposit} idDeposit={draft.idDeposit} selectedIds={form.lines.map((line) => line.idProduct)} disabled={saving} onAdd={form.addLine} /></OrderSection>
          <OrderSection title={`Productos del pedido (${form.lines.length}/100)`}><OrderCart lines={form.lines} availability={available} disabled={saving} errors={fieldErrors} change={form.changeLine} remove={form.removeLine} /></OrderSection>
          {draft.fulfillmentType === "DELIVERY" && <OrderDeliverySection form={form} customer={customer} />}
          <OrderSection title="Observaciones"><OrderField label="Indicaciones para preparar el pedido" error={fieldErrors.observation}><Textarea value={draft.observation} maxLength={500} disabled={saving} onChange={(event) => form.change("observation", event.target.value)} rows={4} placeholder="Indicaciones, referencias o notas internas" /></OrderField></OrderSection>
        </fieldset>
        <aside className="space-y-4 xl:sticky xl:top-20" aria-label="Resumen del pedido">
          <OrderSection title="Resumen del pedido">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{orderMoney(form.totals.subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Descuentos</dt><dd>{orderMoney(form.totals.discountTotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Entrega</dt><dd>{orderMoney(draft.fulfillmentType === "DELIVERY" ? Number(draft.deliveryFee) || 0 : 0)}</dd></div>
              <div className="flex flex-wrap justify-between gap-2 border-t pt-4 text-lg font-bold"><dt>Total</dt><dd>{orderMoney(form.totals.total)}</dd></div>
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">La disponibilidad es informativa. Este pedido no reserva existencias ni registra cobros.</p>
            <Button type="submit" className="h-11 w-full" disabled={saving || lookups.loading}><Save className="size-4" />{saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear pedido"}</Button>
            {canView && <Button type="button" variant="outline" className="w-full" disabled={saving} onClick={() => navigate(initial ? `/admin/orders/${initial.idOrder}` : "/admin/orders")}>{initial ? "Cancelar edición" : "Volver a pedidos"}</Button>}
          </OrderSection>
        </aside>
      </div>
    </form>
  );
};
