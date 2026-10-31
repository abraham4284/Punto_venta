import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { orderCancellationSchema } from "../validations/orders.validations";
import { OrderErrorNotice, OrderField } from "./OrderUi";

export const OrderActionDialog = ({ cancel, label, busy, error, onClose, onConfirm }: { cancel: boolean; label: string; busy: boolean; error: string | null; onClose: () => void; onConfirm: (reason: string) => void }) => {
  const [reason, setReason] = useState(""); const [fieldError, setFieldError] = useState("");
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent showCloseButton={!busy}><form className="space-y-4" onSubmit={(event) => {
    event.preventDefault();
    if (cancel) { const parsed = orderCancellationSchema.safeParse({ reason }); if (!parsed.success) { setFieldError(parsed.error.issues[0].message); return; } onConfirm(parsed.data.reason); }
    else onConfirm("");
  }}><DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>{cancel ? "El pedido conservará su historial. Indicá el motivo de la cancelación." : "Se registrará el avance en el historial del pedido."}</DialogDescription></DialogHeader>
    {error && <OrderErrorNotice message={error} />}{cancel && <OrderField label="Motivo de cancelación *" error={fieldError}><Textarea autoFocus value={reason} minLength={3} maxLength={500} disabled={busy} onChange={(event) => setReason(event.target.value)} rows={4} required /></OrderField>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Volver</Button><Button type="submit" variant={cancel ? "destructive" : "default"} disabled={busy}>{busy ? "Procesando…" : label}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
};
