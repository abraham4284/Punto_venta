import { useCallback, useEffect, useRef, useState } from "react";
import { getSaleReturnsRequest } from "../api/sale-returns.api";
import { returnRequestError } from "../helpers/sale-return-errors.helpers";
import type { SaleReturnsData, SaleReturnResult } from "../types/sale-returns.types";
export const useSaleReturns = (idSale: number, enabled: boolean) => {
 const [state,setState] = useState<{idSale:number;data:SaleReturnsData|null;loading:boolean;error:string|null}>({idSale,data:null,loading:true,error:null});
 const sequence = useRef(0);
 const refresh = useCallback(async () => {
   if (!enabled) return null;
   const current = ++sequence.current;
   setState((previous) => ({idSale,data:previous.idSale === idSale ? previous.data : null,loading:true,error:null}));
   try {
     const response = await getSaleReturnsRequest(idSale);
     if (current !== sequence.current) return null;
     setState({idSale,data:response.data.data,loading:false,error:null}); return response.data.data;
   } catch (cause) {
     if (current === sequence.current) setState((previous) => ({...previous,loading:false,error:returnRequestError(cause).message}));
     return null;
   }
 },[idSale,enabled]);
 const invalidateRequests=useCallback(()=>{sequence.current++;},[]);
 useEffect(() => {
   const timer = window.setTimeout(() => { if(enabled) void refresh(); },0);
   return () => { window.clearTimeout(timer); invalidateRequests(); };
 },[refresh,enabled,invalidateRequests]);
 const recordCreated=(result:SaleReturnResult)=>setState((previous)=>previous.idSale!==idSale||!previous.data?previous:{...previous,loading:true,error:null,data:{...previous.data,summary:result.summary,returns:[...previous.data.returns.filter((row)=>row.idSaleReturn!==result.saleReturn.idSaleReturn),result.saleReturn]}});
 return { recordCreated, data:enabled && state.idSale === idSale ? state.data : null, loading:enabled && (state.idSale !== idSale || state.loading),error:enabled && state.idSale === idSale ? state.error : null,refresh };
};
