import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DeliveryProviderFields } from "./DeliveryProviderFields";
import { deliveryProviderPayload, deliveryProviderSchema, providerInputFrom, providerLabel } from "../helpers/delivery-provider.helpers";
import type { DeliveryActionBody, DeliveryResponse, DeliveryUserOption } from "../types";

type Props = { delivery: DeliveryResponse | null; users: DeliveryUserOption[]; loadingUsers: boolean; actionLoading: boolean; isOpen: boolean; onClose: () => void; onConfirm: (id: number, body: DeliveryActionBody) => Promise<boolean> };
const AssignmentForm = ({ delivery, ...props }: Omit<Props, "delivery"> & { delivery: DeliveryResponse }) => {
  const [value, setValue] = useState(() => providerInputFrom(delivery));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locked = useRef(false);
  const confirm = async () => {
    if (locked.current || props.actionLoading) return;
    const parsed = deliveryProviderSchema.safeParse(deliveryProviderPayload(value));
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]))); return; }
    if (!parsed.data.providerType) { setErrors({ providerType: "Seleccioná cadete propio o servicio tercerizado" }); return; }
    locked.current = true;
    try { if (await props.onConfirm(delivery.idSaleDelivery, parsed.data)) props.onClose(); }
    finally { locked.current = false; }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !locked.current) props.onClose(); }}>
    <DialogContent showCloseButton={!props.actionLoading} className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{delivery.status === "ASSIGNED" ? "Reasignar entrega" : "Asignar entrega"}</DialogTitle><DialogDescription>{delivery.saleNumber} · Actual: {providerLabel(delivery)}</DialogDescription></DialogHeader>
      <DeliveryProviderFields value={value} onChange={setValue} users={props.users} loadingUsers={props.loadingUsers} disabled={props.actionLoading} allowUnassigned={false} errors={errors} />
      {errors.providerType && <p role="alert" className="text-destructive">{errors.providerType}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={props.actionLoading} onClick={props.onClose}>Cancelar</Button><Button type="button" disabled={props.actionLoading} onClick={() => void confirm()}>{props.actionLoading ? "Asignando…" : "Confirmar asignación"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
};
export const AssignDeliveryDialog = (props: Props) => props.isOpen && props.delivery ? <AssignmentForm key={props.delivery.idSaleDelivery} {...props} delivery={props.delivery} /> : null;
