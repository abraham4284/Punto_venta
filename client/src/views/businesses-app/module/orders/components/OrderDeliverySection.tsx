import { Input } from "@/components/ui/input";
import type { useOrderForm } from "../hooks/useOrderForm";
import type { Customer } from "../../customers/types/customers.types";
import { OrderField, OrderSection } from "./OrderUi";

export const OrderDeliverySection = ({ form, customer }: { form: ReturnType<typeof useOrderForm>; customer?: Customer }) => {
  const { draft, change, saving, fieldErrors } = form;
  return (
    <OrderSection title="Datos de entrega">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={form.autofill} disabled={saving || !customer} onChange={(event) => form.changeAutofill(event.target.checked, customer)} />
        <span><span className="block font-medium">Completar con los datos del cliente</span><span className="text-xs text-muted-foreground">Podés editar los datos. Mientras esté activo, cambiar de cliente los actualizará.</span></span>
      </label>
      {!customer && <p className="text-xs text-muted-foreground">Seleccioná un cliente disponible para usar el autocompletado.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["recipientName", "Destinatario *", "text", 240, "delivery.recipientName"],
          ["recipientPhone", "Teléfono *", "tel", 80, "delivery.recipientPhone"],
          ["address", "Dirección *", "text", 255, "delivery.address"],
          ["reference", "Referencia", "text", 500, "delivery.reference"],
        ] as const).map(([field, label, type, max, path]) => <OrderField key={field} label={label} error={fieldErrors[path]}><Input type={type} value={draft[field]} disabled={saving} maxLength={max} onChange={(event) => change(field, event.target.value)} /></OrderField>)}
        <OrderField label="Costo de entrega" error={fieldErrors.deliveryFee}><Input type="number" inputMode="decimal" min="0" step="0.01" value={draft.deliveryFee} disabled={saving} onChange={(event) => change("deliveryFee", event.target.value)} /></OrderField>
      </div>
    </OrderSection>
  );
};
