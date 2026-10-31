import { Link } from "react-router-dom";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOrderForm } from "../hooks/useOrderForm";
import { useOrderLookups } from "../hooks/useOrderLookups";
import { useOrderAvailability } from "../hooks/useOrderAvailability";
import { orderMoney } from "../helpers/orders.helpers";
import type { Order } from "../types/orders.types";
import { OrderErrorNotice, OrderField, OrderSection } from "./OrderUi";
import { OrderProductPicker } from "./OrderProductPicker";
import { OrderCart } from "./OrderCart";

export const OrderForm = ({ initial, onSaved }: { initial?: Order; onSaved: (order: Order) => void }) => {
  const form = useOrderForm(initial, onSaved);
  const lookups = useOrderLookups(true);
  const available = useOrderAvailability(form.draft.idDeposit, form.lines);
  const { draft, change, saving, fieldErrors } = form;
  const customer = lookups.customers.find((item) => String(item.idCustomer) === draft.idCustomer);
  const control = "h-9 w-full rounded-lg border bg-background px-3 text-sm shadow-xs focus-visible:outline-2 focus-visible:outline-ring";
  const errors = Object.entries(fieldErrors);
  return <form noValidate className="space-y-5" onSubmit={(event) => { event.preventDefault(); void form.submit(); }} aria-busy={saving}>
    {lookups.loading && <p role="status" className="text-sm text-muted-foreground">Cargando clientes, depósitos y métodos…</p>}
    {lookups.error && <OrderErrorNotice message={lookups.error} retry={() => void lookups.reload()} />}
    {form.error && <OrderErrorNotice message={`${form.error.message}${form.error.code ? ` (${form.error.code})` : ""}`} />}
    {errors.length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{errors.map(([field, message]) => <li key={field}>{field.startsWith("items.") ? `Línea ${Number(field.split(".")[1]) + 1}: ` : ""}{message}</li>)}</ul>}
    <fieldset disabled={saving} className="min-w-0 space-y-5">
      <OrderSection title="Datos del pedido"><div className="grid gap-4 md:grid-cols-2">
        <OrderField label="Cliente *" error={fieldErrors.idCustomer}><select className={control} value={draft.idCustomer} onChange={(e) => change("idCustomer", e.target.value)} required><option value="">Seleccionar cliente</option>{draft.idCustomer && !lookups.customers.some((item) => item.isActive && String(item.idCustomer) === draft.idCustomer) && <option value={draft.idCustomer}>{initial?.customerSnapshot.fullName || "Cliente seleccionado no disponible"}</option>}{lookups.customers.filter((item) => item.isActive).map((item) => <option key={item.idCustomer} value={item.idCustomer}>{item.fullName}{item.documentNumber ? ` · ${item.documentType} ${item.documentNumber}` : ""}</option>)}</select></OrderField>
        <OrderField label="Depósito *" error={fieldErrors.idDeposit}><select className={control} value={draft.idDeposit} onChange={(e) => change("idDeposit", e.target.value)} required><option value="">Seleccionar depósito</option>{draft.idDeposit && !lookups.deposits.some((item) => item.isActive && String(item.idDeposit) === draft.idDeposit) && <option value={draft.idDeposit}>Depósito seleccionado no disponible</option>}{lookups.deposits.filter((item) => item.isActive).map((item) => <option key={item.idDeposit} value={item.idDeposit}>{item.name}{item.isDefault ? " (predeterminado)" : ""}</option>)}</select></OrderField>
        <OrderField label="Método de pago esperado (opcional)" error={fieldErrors.expectedPaymentMethodId}><select className={control} value={draft.expectedPaymentMethodId} onChange={(e) => change("expectedPaymentMethodId", e.target.value)}><option value="">Sin especificar</option>{draft.expectedPaymentMethodId && !lookups.paymentMethods.some((item) => item.isActive && String(item.idPaymentMethod) === draft.expectedPaymentMethodId) && <option value={draft.expectedPaymentMethodId}>Método seleccionado no disponible</option>}{lookups.paymentMethods.filter((item) => item.isActive).map((item) => <option key={item.idPaymentMethod} value={item.idPaymentMethod}>{item.name}</option>)}</select></OrderField>
        <OrderField label="Modalidad"><select className={control} value={draft.fulfillmentType} onChange={(e) => change("fulfillmentType", e.target.value as "PICKUP" | "DELIVERY")}><option value="PICKUP">Retiro</option><option value="DELIVERY">Entrega</option></select></OrderField>
      </div>{customer && <p className="break-words text-sm text-muted-foreground">{customer.fullName} · {customer.documentNumber ? `${customer.documentType} ${customer.documentNumber}` : "Sin documento"}{customer.phone ? ` · ${customer.phone}` : ""}{customer.email ? ` · ${customer.email}` : ""}</p>}<p className="text-xs text-muted-foreground">El método esperado no registra un pago. Si necesitás un cliente nuevo, podés crearlo desde <Link className="underline" to="/admin/clients" target="_blank" rel="noreferrer">Clientes en otra pestaña</Link> y recargar los datos sin perder el formulario.</p></OrderSection>
      {draft.fulfillmentType === "DELIVERY" && <OrderSection title="Datos de entrega"><div className="grid gap-4 md:grid-cols-2">{([
        ["recipientName", "Destinatario *", "text", 240, "delivery.recipientName"], ["recipientPhone", "Teléfono *", "tel", 80, "delivery.recipientPhone"],
        ["address", "Dirección *", "text", 255, "delivery.address"], ["reference", "Referencia", "text", 500, "delivery.reference"],
      ] as const).map(([field, label, type, max, path]) => <OrderField key={field} label={label} error={fieldErrors[path]}><Input type={type} value={draft[field]} maxLength={max} onChange={(e) => change(field, e.target.value)} /></OrderField>)}<OrderField label="Costo de entrega" error={fieldErrors.deliveryFee}><Input type="number" inputMode="decimal" min="0" step="0.01" value={draft.deliveryFee} onChange={(e) => change("deliveryFee", e.target.value)} /></OrderField></div></OrderSection>}
      <OrderSection title="Agregar productos"><OrderProductPicker key={draft.idDeposit} idDeposit={draft.idDeposit} selectedIds={form.lines.map((line) => line.idProduct)} disabled={saving} onAdd={form.addLine} /></OrderSection>
      <OrderSection title={`Productos del pedido (${form.lines.length}/100)`}><OrderCart lines={form.lines} availability={available} disabled={saving} errors={fieldErrors} change={form.changeLine} remove={form.removeLine} /></OrderSection>
      <OrderSection title="Resumen"><div className="grid gap-6 md:grid-cols-2"><OrderField label="Observación" error={fieldErrors.observation}><Textarea value={draft.observation} maxLength={500} onChange={(e) => change("observation", e.target.value)} rows={4} /></OrderField><dl className="space-y-2 text-sm">{[["Subtotal", form.totals.subtotal], ["Descuentos de líneas", form.totals.discountTotal], ["Entrega", draft.fulfillmentType === "DELIVERY" ? Number(draft.deliveryFee) || 0 : 0], ["Total del pedido", form.totals.total]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4 border-b py-2"><dt>{label}</dt><dd className="font-semibold">{orderMoney(Number(value))}</dd></div>)}</dl></div><p className="text-xs text-muted-foreground">La disponibilidad es informativa y el pedido no reserva existencias.</p></OrderSection>
      <div className="flex flex-wrap justify-end gap-3"><Button type="submit" disabled={saving || lookups.loading}><Save className="size-4" />{saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear pedido"}</Button></div>
    </fieldset>
  </form>;
};
