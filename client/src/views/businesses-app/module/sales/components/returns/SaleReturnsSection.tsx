import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card,CardHeader,CardTitle,CardContent } from "@/components/ui/card";
import { hasReturnableBalance,saleReturnBlocker } from "../../helpers/sale-return.helpers";
import type { SaleWithDetailsResponse } from "../../types";
import type { SaleReturnResult } from "../../types/sale-returns.types";
import type { useSaleReturns } from "../../hooks/useSaleReturns";
import { SaleReturnsSummary } from "./SaleReturnsSummary";
import { SaleReturnsHistory } from "./SaleReturnsHistory";
import { RegisterSaleReturnDialog } from "./RegisterSaleReturnDialog";
interface Props {sale:SaleWithDetailsResponse;returnsState:ReturnType<typeof useSaleReturns>;canCreate:boolean;onSaleRefresh:()=>Promise<void>|void}
export const SaleReturnsSection = ({sale,returnsState:state,canCreate,onSaleRefresh}:Props) => {
 const [open,setOpen]=useState(false),[started,setStarted]=useState(false);
 const data=state.data;
 const blocker=data?saleReturnBlocker(sale,data):null;
 const saved=(result:SaleReturnResult)=>{state.recordCreated(result);setOpen(false);setStarted(false);void state.refresh();void Promise.resolve().then(onSaleRefresh).catch(()=>undefined);};
 return <Card><CardHeader><CardTitle>Devoluciones y reembolsos</CardTitle></CardHeader><CardContent className="space-y-5">
 {state.loading&&<p role="status" className="text-sm text-muted-foreground">Actualizando devoluciones y saldos…</p>}
 {state.error&&<div role="alert" className="space-y-2 text-sm text-destructive"><p>{state.error}</p><Button variant="outline" onClick={()=>void state.refresh()} disabled={state.loading}>Reintentar devoluciones</Button></div>}
 {data&&<><SaleReturnsSummary summary={data.summary} originalTotal={sale.total}/>{blocker&&sale.status==="COMPLETED"&&<p role="status" className="rounded-lg bg-muted p-3 text-sm">{blocker}</p>}
 {canCreate&&sale.status==="COMPLETED"&&hasReturnableBalance(data)&&<Button type="button" disabled={state.loading||Boolean(state.error)||Boolean(blocker)} onClick={()=>{setStarted(true);setOpen(true);}}>Registrar devolución</Button>}
 {!hasReturnableBalance(data)&&<p className="text-sm text-muted-foreground">No quedan saldos de productos o envío para otra devolución. Consultá los importes reembolsados y el neto arriba.</p>}
 <SaleReturnsHistory returns={data.returns}/>
 {canCreate&&started&&<RegisterSaleReturnDialog open={open} sale={sale} data={data} externalBlocked={state.loading||Boolean(state.error)} onClose={()=>setOpen(false)} onSaved={saved} onRefresh={state.refresh}/>}</>}
 </CardContent></Card>;
};
