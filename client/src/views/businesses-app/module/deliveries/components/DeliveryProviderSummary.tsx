import { providerLabel, type DeliveryProviderPayload } from "../helpers/delivery-provider.helpers";
export const DeliveryProviderSummary = ({ value }: { value: DeliveryProviderPayload & { assignedUserName?: string | null } }) => <span className="space-y-1 break-words text-sm">
  <span className="block font-medium">{providerLabel(value)}</span>
  {value.providerType === "THIRD_PARTY" && <><span className="block">Referencia: {value.externalReference || "Sin referencia"}</span><span className="block">Contacto: {value.externalContactName || "Sin contacto"} {value.externalContactPhone || ""}</span><span className="block">Costo externo: {value.externalCost == null ? "Sin informar" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value.externalCost)} (informativo)</span></>}
</span>;
