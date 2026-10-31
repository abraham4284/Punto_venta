import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useOrderForm } from "../hooks/useOrderForm";
import type { useOrderLookups } from "../hooks/useOrderLookups";
import type { Order } from "../types/orders.types";
import { OrderSection } from "./OrderUi";
import { OrderSelect } from "./OrderSelect";
import { OrderCustomerModal } from "./OrderCustomerModal";

export const OrderContextSection = ({ form, lookups, initial }: {
  form: ReturnType<typeof useOrderForm>; lookups: ReturnType<typeof useOrderLookups>; initial?: Order;
}) => {
  const [open, setOpen] = useState(false);
  const { draft, saving, change, fieldErrors } = form;
  const customer = lookups.customers.find((item) => String(item.idCustomer) === draft.idCustomer);
  const selected = customer || (initial && draft.idCustomer === String(initial.idCustomer) ? initial.customerSnapshot : null);
  const deposits = lookups.deposits.filter((item) => item.isActive).map((item) => ({ value: String(item.idDeposit), label: `${item.name}${item.isDefault ? " · Predeterminado" : ""}` }));
  const methods = lookups.paymentMethods.filter((item) => item.isActive).map((item) => ({ value: String(item.idPaymentMethod), label: item.name }));
  if (draft.idDeposit && !deposits.some((item) => item.value === draft.idDeposit)) deposits.push({ value: draft.idDeposit, label: "Depósito seleccionado no disponible" });
  if (draft.expectedPaymentMethodId && !methods.some((item) => item.value === draft.expectedPaymentMethodId)) methods.push({ value: draft.expectedPaymentMethodId, label: "Método seleccionado no disponible" });
  return (
    <OrderSection title="Contexto del pedido">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-medium"><UserRound className="size-4" />Cliente del pedido *</h3>
            <Button type="button" variant="outline" disabled={saving || lookups.loading} onClick={() => setOpen(true)}>{selected ? "Cambiar cliente" : "Seleccionar cliente"}</Button>
          </div>
          {selected ? <div className="space-y-1 break-words"><p className="font-semibold">{selected.fullName}</p><p className="text-xs text-muted-foreground">{selected.documentNumber ? `${selected.documentType} ${selected.documentNumber}` : "Sin documento"}</p><p className="text-sm text-muted-foreground">{selected.phone || "Sin teléfono"}</p><p className="text-sm text-muted-foreground">{selected.email || "Sin email"}</p></div> : <p className="py-3 text-sm text-muted-foreground">Seleccioná el cliente para preparar este pedido.</p>}
          {fieldErrors.idCustomer && <p role="alert" className="text-xs text-destructive">{fieldErrors.idCustomer}</p>}
          <p className="text-xs text-muted-foreground">¿Cliente nuevo? <Link to="/admin/clients" target="_blank" rel="noreferrer" className="underline">Abrir Clientes en otra pestaña</Link>.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <OrderSelect id="order-deposit" label="Depósito *" value={draft.idDeposit} disabled={saving} error={fieldErrors.idDeposit} options={[{ value: "", label: "Seleccionar depósito" }, ...deposits]} onChange={(value) => change("idDeposit", value)} />
          <OrderSelect id="order-mode" label="Modalidad" value={draft.fulfillmentType} disabled={saving} options={[{ value: "PICKUP", label: "Retiro" }, { value: "DELIVERY", label: "Entrega" }]} onChange={(value) => change("fulfillmentType", value as "PICKUP" | "DELIVERY")} />
          <div className="sm:col-span-2"><OrderSelect id="order-payment" label="Método de pago esperado (opcional)" value={draft.expectedPaymentMethodId} disabled={saving} error={fieldErrors.expectedPaymentMethodId} options={[{ value: "", label: "Sin especificar" }, ...methods]} onChange={(value) => change("expectedPaymentMethodId", value)} /><p className="mt-2 text-xs text-muted-foreground">Es una previsión: no registra un cobro ni afecta caja.</p></div>
        </div>
      </div>
      {open && !saving && <OrderCustomerModal customers={lookups.customers} onSelect={form.selectCustomer} onClose={() => setOpen(false)} />}
    </OrderSection>
  );
};
