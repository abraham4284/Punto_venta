import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers";
import { useRegisterSaleReturn } from "../../hooks/useRegisterSaleReturn";
import type { SaleWithDetailsResponse } from "../../types";
import type { SaleReturnsData, SaleReturnResult } from "../../types/sale-returns.types";
import { ReturnField } from "./ReturnField";
import { SaleReturnItemsSection } from "./SaleReturnItemsSection";
import { SaleReturnRefundsSection } from "./SaleReturnRefundsSection";
interface Props {open:boolean;sale:SaleWithDetailsResponse;data:SaleReturnsData;onClose:()=>void;onSaved:(result:SaleReturnResult)=>void;onRefresh:()=>Promise<SaleReturnsData|null>;externalBlocked:boolean}
export const RegisterSaleReturnDialog = ({open,sale,data,onClose,onSaved,onRefresh,externalBlocked}:Props) => {
 const form=useRegisterSaleReturn(sale,data,onSaved,onRefresh,externalBlocked);
 const busy=form.saving||form.checking;
 const updateText=(field:"reason"|"observation"|"deliveryFeeRefund",value:string)=>form.change((current)=>({...current,[field]:value}));
 return <Dialog open={open} onOpenChange={(value)=>{if(!value&&!busy)onClose();}}><DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden sm:max-w-4xl" showCloseButton={!busy}>
 <DialogHeader><DialogTitle>Registrar devolución · {sale.saleNumber}</DialogTitle><DialogDescription>Registrá los productos y el reembolso correspondiente. La venta conserva su total y estado históricos. El backend confirma los importes finales.</DialogDescription></DialogHeader>
 <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={(event)=>{event.preventDefault();void form.submit();}}>
 <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1 pb-2">
 <fieldset disabled={busy} className="space-y-6"><legend className="sr-only">Datos de la devolución</legend>
 <SaleReturnItemsSection items={data.returnableItems} saleItems={sale.items} draft={form.draft} change={form.change} errors={form.errors} disabled={busy}/>
 {(data.remainingDeliveryFeeRefund>0||form.draft.deliveryFeeRefund!=="0")?<ReturnField label="Reembolso de envío" value={form.draft.deliveryFeeRefund} onChange={(value)=>updateText("deliveryFeeRefund",value)} numeric step="0.01" max={data.remainingDeliveryFeeRefund} error={form.errors.deliveryFeeRefund} help={`Máximo: ${formatCurrency(data.remainingDeliveryFeeRefund)}`}/>:<p className="text-sm text-muted-foreground">No queda saldo de envío por reembolsar.</p>}
 <div className="grid gap-3 sm:grid-cols-2"><ReturnField label="Motivo *" value={form.draft.reason} maxLength={500} onChange={(value)=>updateText("reason",value)} error={form.errors.reason}/><ReturnField label="Observación" multiline value={form.draft.observation} maxLength={500} onChange={(value)=>updateText("observation",value)} error={form.errors.observation}/></div>
 <div role="status" className="grid gap-2 rounded-lg bg-muted p-3 text-sm sm:grid-cols-3"><p>Mercadería: <strong>{formatCurrency(form.plan.merchandise)}</strong></p><p>Envío: <strong>{formatCurrency(Number(form.draft.deliveryFeeRefund)||0)}</strong></p><p>Total a reembolsar: <strong>{formatCurrency(form.plan.total)}</strong></p></div>
 <SaleReturnRefundsSection payments={data.refundablePayments} draft={form.draft} allocations={form.plan.allocations} change={form.change} errors={form.errors} disabled={busy} total={form.plan.total} assigned={form.plan.assigned} remaining={form.plan.remaining}/>
 {form.plan.hasCash&&<section aria-label="Caja para el reembolso" className="space-y-2 rounded-lg border p-3"><h3 className="font-semibold">Caja actual</h3><p className="text-sm">{form.cash.loading?"Consultando caja…":form.cash.currentSession?`${form.cash.currentSession.cashRegisterName} · Abierta`:"No hay caja abierta disponible. Abrí una caja autorizada para devolver efectivo."}</p>{form.cash.error&&<p role="alert" className="text-sm text-destructive">No se pudo consultar la caja actual. Actualizala antes de confirmar.</p>}<Button type="button" variant="outline" disabled={busy||form.cash.loading} onClick={()=>void form.cash.refreshCurrentSession()}>Actualizar caja</Button></section>}
 </fieldset>
 {form.blocker&&<p role="alert" className="rounded-lg bg-muted p-3 text-sm">{form.blocker}</p>}
 {form.error&&<p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{form.error}</p>}
 {Object.keys(form.errors).length>0&&<ul aria-label="Campos a revisar" className="list-inside list-disc text-sm text-destructive">{Array.from(new Set(Object.values(form.errors))).map((message)=><li key={message}>{message}</li>)}</ul>}
 {(form.needsRefresh||externalBlocked)&&<Button type="button" variant="outline" disabled={busy} onClick={()=>void form.refreshBalances()}>{form.checking?"Actualizando saldos…":"Actualizar saldos para reintentar"}</Button>}
 </div><DialogFooter className="m-0 shrink-0 flex-wrap rounded-lg p-3"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cerrar</Button><Button type="submit" disabled={form.blocked}>{form.saving?"Registrando…":form.checking?"Actualizando saldos…":"Confirmar devolución"}</Button></DialogFooter>
 </form></DialogContent></Dialog>;
};
