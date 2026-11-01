import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "@/hooks/useForm";
import { useSaleCashSession } from "./useSaleCashSession";
import { createSaleReturnRequest } from "../api/sale-returns.api";
import { initialReturnDraft, planSaleReturn, returnSubmissionKey, saleReturnBlocker } from "../helpers/sale-return.helpers";
import { returnRequestError, shouldRefreshReturnBalances } from "../helpers/sale-return-errors.helpers";
import type { SaleWithDetailsResponse } from "../types";
import type { SaleReturnDraft, SaleReturnsData, SaleReturnResult } from "../types/sale-returns.types";
export const useRegisterSaleReturn = (sale: SaleWithDetailsResponse, data:SaleReturnsData,onSaved:(result:SaleReturnResult)=>void,onRefresh:()=>Promise<SaleReturnsData|null>,externalBlocked:boolean) => {
 const {formSate:draft,setFormSate:setDraft} = useForm(initialReturnDraft(data));
 const cash = useSaleCashSession();
 const [saving,setSaving]=useState(false), [checking,setChecking]=useState(false), [needsRefresh,setNeedsRefresh]=useState(false);
 const [error,setError]=useState<string|null>(null), [serverErrors,setServerErrors]=useState<Record<string,string>>({});
 const locked = useRef(false), attempt = useRef<{fingerprint:string;key:string}|null>(null);
 const plan = planSaleReturn(draft,data,sale.items,cash.currentSession?.idCashSession ?? null);
 const blocker = saleReturnBlocker(sale,data);
 const change = (update:(current:SaleReturnDraft)=>SaleReturnDraft) => { if(locked.current) return; setServerErrors({}); setDraft(update); };
 const refreshBalances = async () => {
   setNeedsRefresh(true);setChecking(true);
   try { const latest=await onRefresh();if(latest)setNeedsRefresh(false);else setError("No se pudieron actualizar los saldos. Actualizalos antes de reintentar."); }
   finally {setChecking(false);}
 };
 const blocked = saving || checking || needsRefresh || externalBlocked || Boolean(blocker) || !plan.valid || (plan.hasCash && (cash.loading || Boolean(cash.error) || !cash.currentSession));
 const submit = async () => {
   if(locked.current || blocked) return;
   locked.current=true;setSaving(true);setError(null);setServerErrors({});
   let success:SaleReturnResult|null=null;
   try {
     // The fingerprint invalidates attempts only when the actual serialized payload changes.
     attempt.current=returnSubmissionKey(attempt.current,plan.payload);
     const response=await createSaleReturnRequest(sale.idSale,plan.payload,attempt.current.key);
     attempt.current=null;success=response.data.data;toast.success("Devolución registrada correctamente");
   } catch(cause) {
     const failure=returnRequestError(cause);setError(failure.message);
     const fields:Record<string,string>={};
     for(const issue of failure.errors) {
       const parts=issue.field.split(".");
       if(parts[0]==="items" && plan.payload.items[Number(parts[1])]) parts[1]=String(plan.payload.items[Number(parts[1])].idSaleDetail);
       if(parts[0]==="refunds" && plan.payload.refunds[Number(parts[1])]) parts[1]=String(plan.payload.refunds[Number(parts[1])].idSalePayment);
       fields[parts.join(".")]=issue.message;
     }
     setServerErrors(fields);
     if(shouldRefreshReturnBalances(failure)) await refreshBalances();
     if(failure.code === "SALE_RETURN_CASH_SESSION_CLOSED" || failure.code === "SALE_RETURN_CASH_SESSION_REQUIRED") await cash.refreshCurrentSession();
   } finally {locked.current=false;setSaving(false);}
   if(success) onSaved(success);
 };
 return {draft,plan,cash,saving,checking,needsRefresh,error,errors:{...plan.errors,...serverErrors},blocked,blocker,change,submit,refreshBalances};
};
