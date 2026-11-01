import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency,formatDate } from "@/helpers";
import type { SaleReturn } from "../../types/sale-returns.types";
import { SaleReturnDetailDialog } from "./SaleReturnDetailDialog";
export const SaleReturnsHistory = ({returns}:{returns:SaleReturn[]}) => {
 const [selected,setSelected]=useState<number|null>(null);
 const sorted=[...returns].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()||b.idSaleReturn-a.idSaleReturn);
 return <section className="space-y-3" aria-label="Historial de devoluciones"><h3 className="font-semibold">Historial de devoluciones</h3>{!sorted.length&&<p className="text-sm text-muted-foreground">No hay devoluciones registradas.</p>}{sorted.map((row)=><article key={row.idSaleReturn} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 space-y-1 text-sm"><p className="break-all font-medium">{row.returnNumber}</p><p className="text-muted-foreground">{formatDate(row.createdAt)} · {row.createdBy.name} · {row.items.length} líneas</p><p className="whitespace-pre-wrap break-words">{row.reason}</p><p>Mercadería {formatCurrency(row.merchandiseAmount)} · Envío {formatCurrency(row.deliveryFeeRefund)} · Reembolsado <strong>{formatCurrency(row.totalRefund)}</strong></p></div><Button variant="outline" className="shrink-0" onClick={()=>setSelected(row.idSaleReturn)} aria-label={`Ver devolución ${row.returnNumber}`}>Ver detalle</Button></article>)}{selected!=null&&<SaleReturnDetailDialog key={selected} id={selected} onClose={()=>setSelected(null)}/>}</section>;
};
