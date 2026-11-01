import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/views/businesses-app/components/operation-details";
import { formatCurrency } from "@/helpers";
import { previewReturnItem } from "../../helpers/sale-return.helpers";
import type { SaleDetailResponse } from "../../types";
import type { ReturnableItem,SaleReturnDraft } from "../../types/sale-returns.types";
import { ReturnField } from "./ReturnField";
interface Props {items:ReturnableItem[];saleItems:SaleDetailResponse[];draft:SaleReturnDraft;change:(update:(draft:SaleReturnDraft)=>SaleReturnDraft)=>void;errors:Record<string,string>;disabled:boolean}
export const SaleReturnItemsSection = ({items,saleItems,draft,change,errors,disabled}:Props) => <section className="space-y-3" aria-label="Productos a devolver"><h3 className="font-semibold">Productos</h3>
 {!items.some((row)=>row.remainingQuantity>0)&&<p className="text-sm text-muted-foreground">No quedan productos por devolver. Si hay saldo de envío, podés reembolsarlo.</p>}
 {items.filter((row)=>row.remainingQuantity>0||draft.items.some((d)=>d.idSaleDetail===row.idSaleDetail&&d.selected)).map((row)=>{
   const input=draft.items.find((d)=>d.idSaleDetail===row.idSaleDetail);if(!input)return null;
   const original=saleItems.find((item)=>item.idSaleDetail===row.idSaleDetail);
   const update=(values:Partial<typeof input>)=>change((current)=>({...current,items:current.items.map((item)=>item.idSaleDetail===row.idSaleDetail?{...item,...values}:item)}));
   const preview=input.selected?previewReturnItem(input.quantity,row,original):0;
   return <article key={row.idSaleDetail} className="space-y-3 rounded-lg border p-3"><div className="flex items-start gap-3"><ProductThumbnail imageUrl={original?.productImageUrl??null} name={row.product.productName}/><div className="min-w-0 flex-1"><p className="break-words font-medium">{row.product.productName}</p><p className="text-xs text-muted-foreground">{row.product.barcode||"Sin código"} · {row.product.unitType}</p><p className="text-xs text-muted-foreground">Vendido: {row.soldQuantity} · Devuelto: {row.returnedQuantity} · Disponible: {row.remainingQuantity}</p><p className="text-sm">Saldo: {formatCurrency(row.remainingRefundAmount)}</p></div></div>
   {row.remainingQuantity<=0?<><p role="alert" className="text-sm text-destructive">Esta línea ya no tiene saldo.</p><Button type="button" variant="outline" disabled={disabled} onClick={()=>update({selected:false})}>Quitar de la devolución</Button></>:<><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={input.selected} disabled={disabled} onChange={(e)=>update({selected:e.target.checked})}/>Devolver este producto</label>{input.selected&&<div className="grid gap-3 sm:grid-cols-2"><ReturnField label="Cantidad a devolver" value={input.quantity} onChange={(quantity)=>update({quantity})} numeric step={row.product.unitType==="UNIT"?"1":"0.01"} max={row.remainingQuantity} disabled={disabled} error={errors[`items.${row.idSaleDetail}.quantity`]}/><div className="space-y-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={input.restock} disabled={disabled} onChange={(e)=>update({restock:e.target.checked})}/>Reingresar al stock</label><p className="text-xs text-muted-foreground">Desmarcalo si el producto volvió dañado, incompleto o no es revendible. El reingreso se realiza al depósito original.</p><p className="text-sm">Importe estimado: {preview==null?"Revisá la cantidad":formatCurrency(preview)}</p></div></div>}</>}
   </article>;
 })}</section>;
