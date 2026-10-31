import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { DeliveryProviderInput } from "../helpers/delivery-provider.helpers";

export const DeliveryProviderFields = ({ value, onChange, users, disabled, loadingUsers, allowUnassigned = true, errors = {} }: {
  value: DeliveryProviderInput; onChange: (value: DeliveryProviderInput) => void; users: { idUser: number; name: string }[];
  disabled?: boolean; loadingUsers?: boolean; allowUnassigned?: boolean; errors?: Record<string, string>;
}) => {
  const id = useId();
  const option = value.providerType || "none";
  const labels: Record<string, string> = { none: "Sin asignar por ahora", INTERNAL: "Cadete propio", THIRD_PARTY: "Servicio tercerizado" };
  return <div className="space-y-3">
    <label className="block space-y-2 text-sm font-medium"><span>Tipo de asignación</span><Select value={option} disabled={disabled} onValueChange={(next) => { if (next) onChange({ ...value, providerType: next === "none" ? "" : next as DeliveryProviderInput["providerType"] }); }}><SelectTrigger className="w-full" aria-label="Tipo de asignación">{labels[option]}</SelectTrigger><SelectContent>{Object.entries(labels).filter(([key]) => allowUnassigned || key !== "none").map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></label>
    {value.providerType === "INTERNAL" && <label className="block space-y-2 text-sm font-medium"><span>Cadete *</span><Select value={value.assignedToUserId ? String(value.assignedToUserId) : "none"} disabled={disabled || loadingUsers} onValueChange={(next) => onChange({ ...value, assignedToUserId: next && next !== "none" ? Number(next) : null })}><SelectTrigger className="w-full" aria-label="Cadete">{loadingUsers ? "Cargando cadetes…" : users.find((user) => user.idUser === value.assignedToUserId)?.name || "Seleccionar cadete"}</SelectTrigger><SelectContent><SelectItem value="none">Seleccionar cadete</SelectItem>{users.map((user) => <SelectItem key={user.idUser} value={String(user.idUser)}>{user.name}</SelectItem>)}</SelectContent></Select></label>}
    {value.providerType === "THIRD_PARTY" && <div className="grid gap-3 sm:grid-cols-2">{([
      ["externalProviderName", "Proveedor *", 120, "text"], ["externalReference", "Referencia del servicio", 150, "text"], ["externalContactName", "Contacto", 160, "text"], ["externalContactPhone", "Teléfono del servicio", 80, "tel"], ["externalCost", "Costo del servicio (informativo)", undefined, "number"],
    ] as const).map(([field, label, max, type]) => <div key={field} className="space-y-2"><label htmlFor={`${id}-${field}`} className="text-sm font-medium">{label}</label><Input id={`${id}-${field}`} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} maxLength={max} value={value[field]} disabled={disabled} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${id}-${field}-error` : undefined} onChange={(event) => onChange({ ...value, [field]: event.target.value })} />{errors[field] && <p id={`${id}-${field}-error`} role="alert" className="text-xs text-destructive">{errors[field]}</p>}</div>)}<p className="text-xs text-muted-foreground sm:col-span-2">El costo externo es logístico: no cambia el envío cobrado al cliente ni genera pagos o movimientos de caja.</p></div>}
    {errors.assignedToUserId && <p role="alert" className="text-sm text-destructive">{errors.assignedToUserId}</p>}
  </div>;
};
