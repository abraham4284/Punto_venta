// Isolated frontend tests: local TypeScript compiler + built-in node:test. No backend imports or DB.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const compile = (value) => ts.transpileModule(value, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const dataUrl = (value) => `data:text/javascript;base64,${Buffer.from(value).toString("base64")}`;
const idempotency = dataUrl(compile(source("../src/helpers/idempotency.helper.ts")));
const load = async (name) => {
 let code = compile(source(`../src/views/businesses-app/module/sales/helpers/${name}.ts`));
 for (const name of ["decimal.js","zod","axios"]) code=code.replaceAll(`from "${name}"`, `from "${import.meta.resolve(name)}"`);
 code=code.replaceAll('from "@/helpers/idempotency.helper"',`from "${idempotency}"`);
 return import(dataUrl(code));
};
const h=await load("sale-return.helpers");
const e=await load("sale-return-errors.helpers");
const payment=(id=1,cash=true,amount=10)=>({idSalePayment:id,paymentMethod:{idPaymentMethod:id,name:cash?"Efectivo":"Transferencia"},amount,alreadyRefunded:0,remainingRefundable:amount,affectsCash:cash,status:"CONFIRMED"});
const data=()=>({returns:[],summary:{returnStatus:"NONE",refundStatus:"NONE",returnedMerchandiseAmount:0,refundedDeliveryFee:0,refundedTotal:0,netSaleAmount:10},returnableItems:[{idSaleDetail:1,product:{idProduct:1,productName:"Producto",barcode:null,unitType:"UNIT"},soldQuantity:3,returnedQuantity:0,remainingQuantity:3,remainingRefundAmount:10}],refundablePayments:[payment()],remainingDeliveryFeeRefund:0});
const saleItems=[{idSaleDetail:1,total:10}];
const draft=(d=data())=>{const result=h.initialReturnDraft(d);result.reason="Devolución";result.items[0].selected=true;result.items[0].quantity="1";return result;};
test("partial preview rounds half up from historical total",()=>assert.equal(h.previewReturnItem("1",data().returnableItems[0],saleItems[0]),3.33));
test("final residual absorbs exact remaining cents",()=>{const row={...data().returnableItems[0],remainingQuantity:1,remainingRefundAmount:3.34};assert.equal(h.previewReturnItem("1",row,saleItems[0]),3.34);});
for(const quantity of ["0","-1","4","1.001","NaN","","1e1","1.5"]){test(`UNIT rejects invalid quantity ${quantity}`,()=>assert.ok(h.returnQuantityError(quantity,data().returnableItems[0])));}
test("decimal units allow two decimals",()=>{const row={...data().returnableItems[0],product:{...data().returnableItems[0].product,unitType:"KG"}};assert.equal(h.returnQuantityError("0.25",row),null);assert.equal(h.previewReturnItem("0.25",row,saleItems[0]),0.83);});
test("missing historical line never invents a preview",()=>assert.equal(h.previewReturnItem("1",data().returnableItems[0]),null));
test("auto allocations preserve received order and confirmed balances",()=>{const ps=[{...payment(1,true,5),remainingRefundable:2},payment(2,false,9),{...payment(3,false,9),status:"PENDING"}];assert.deepEqual(h.autoAllocateRefunds(5,ps).map(p=>p.amount),["2.00","3.00","0.00"]);});
test("mixed allocations and cash detection",()=>{const d=data();d.refundablePayments=[payment(1,true,1),payment(2,false,9)];const plan=h.planSaleReturn(draft(d),d,saleItems,7);assert.equal(plan.valid,true);assert.equal(plan.hasCash,true);assert.equal(plan.payload.idCashSession,7);assert.deepEqual(plan.payload.refunds.map(p=>p.amount),[1,2.33]);});
test("noncash never sends available current cash session",()=>{const d=data();d.refundablePayments=[payment(1,false)];const p=h.planSaleReturn(draft(d),d,saleItems,7);assert.equal(p.valid,true);assert.equal(p.hasCash,false);assert.equal(p.payload.idCashSession,null);});
test("cash without current session blocked",()=>assert.ok(h.planSaleReturn(draft(),data(),saleItems,null).errors.idCashSession));
test("manual allocations must equal preview exactly",()=>{const input=draft();input.manualRefunds=true;input.refunds[0].amount="3.32";const p=h.planSaleReturn(input,data(),saleItems,7);assert.equal(p.valid,false);assert.equal(p.remaining,0.01);});
test("manual allocation respects each original payment balance",()=>{const d=data();d.refundablePayments[0].remainingRefundable=1;const input=draft(d);input.manualRefunds=true;input.refunds[0].amount="3.33";assert.ok(h.planSaleReturn(input,d,saleItems,7).errors["refunds.1.amount"]);});
for(const amount of ["-1","1.001","Infinity"]){test(`invalid allocation ${amount}`,()=>{const input=draft();input.manualRefunds=true;input.refunds[0].amount=amount;assert.equal(h.planSaleReturn(input,data(),saleItems,7).valid,false);});}
test("fee-only after full merchandise return",()=>{const d=data();d.returnableItems[0].remainingQuantity=0;d.returnableItems[0].remainingRefundAmount=0;d.remainingDeliveryFeeRefund=4;d.summary.returnStatus="FULL";const input=h.initialReturnDraft(d);input.reason="Envío";input.deliveryFeeRefund="4";const p=h.planSaleReturn(input,d,saleItems,7);assert.equal(p.valid,true);assert.deepEqual(p.payload.items,[]);assert.equal(h.hasReturnableBalance(d),true);});
test("fee can coexist with items",()=>{const d=data();d.remainingDeliveryFeeRefund=2;const input=draft(d);input.deliveryFeeRefund="1.25";assert.equal(h.planSaleReturn(input,d,saleItems,7).total,4.58);});
test("fee overflow blocked",()=>{const input=draft();input.deliveryFeeRefund="1";assert.ok(h.planSaleReturn(input,data(),saleItems,7).errors.deliveryFeeRefund);});
test("zero-value physical item requires no refund or cash",()=>{const d=data();d.returnableItems[0].remainingRefundAmount=0;const input=draft(d);const p=h.planSaleReturn(input,d,[{idSaleDetail:1,total:0}],7);assert.equal(p.valid,true);assert.deepEqual(p.payload.refunds,[]);assert.equal(p.payload.idCashSession,null);});
test("empty operation blocked",()=>{const input=h.initialReturnDraft(data());input.reason="Nada";assert.equal(h.planSaleReturn(input,data(),saleItems,7).valid,false);});
test("no balances hides another return",()=>{const d=data();d.returnableItems[0].remainingQuantity=0;assert.equal(h.hasReturnableBalance(d),false);});
test("default restock is editable and payload only sends authorized fields",()=>{const input=draft();assert.equal(input.items[0].restock,true);input.items[0].restock=false;const p=h.planSaleReturn(input,data(),saleItems,7);assert.deepEqual(Object.keys(p.payload).sort(),["deliveryFeeRefund","idCashSession","items","observation","reason","refunds"].sort());assert.deepEqual(p.payload.items,[{idSaleDetail:1,quantity:1,restock:false}]);});
for(const field of ["reason","observation"]){test(`long ${field} blocked`,()=>{const input=draft();input[field]="a".repeat(501);assert.equal(h.planSaleReturn(input,data(),saleItems,7).valid,false);});}
test("long refund reference blocked",()=>{const input=draft();input.refunds[0].reference="a".repeat(151);assert.equal(h.planSaleReturn(input,data(),saleItems,7).valid,false);});
test("unchanged payload retries same UUID",()=>{const payload=h.planSaleReturn(draft(),data(),saleItems,7).payload;const key=h.returnSubmissionKey(null,payload,()=>"key1");assert.strictEqual(h.returnSubmissionKey(key,structuredClone(payload),()=>"key2"),key);});
for(const field of ["reason","observation","deliveryFeeRefund","items","refunds","idCashSession"]){test(`editing ${field} changes attempt`,()=>{const payload=h.planSaleReturn(draft(),data(),saleItems,7).payload;const key=h.returnSubmissionKey(null,payload,()=>"key1");const changed={...payload,[field]:(field==="reason"||field==="observation")?"Otro":null};assert.equal(h.returnSubmissionKey(key,changed,()=>"key2").key,"key2");});}
for(const status of ["PENDING","COLLECTED"]){test(`${status} blocks create`,()=>{const d=data();d.refundablePayments[0].status=status;assert.match(h.saleReturnBlocker({status:"COMPLETED",delivery:null,total:10},d),/pagos/);});}
test("DELIVERED allows and OUT blocks",()=>{const sale={status:"COMPLETED",delivery:{status:"DELIVERED"},total:10};assert.equal(h.saleReturnBlocker(sale,data()),null);sale.delivery.status="OUT_FOR_DELIVERY";assert.match(h.saleReturnBlocker(sale,data()),/en camino/);});
test("CANCELLED and insufficient confirmed coverage block",()=>{assert.ok(h.saleReturnBlocker({status:"CANCELLED",delivery:null,total:10},data()));assert.ok(h.saleReturnBlocker({status:"COMPLETED",delivery:null,total:11},data()));});
for(const code of ["SALE_RETURN_QUANTITY_EXCEEDED","SALE_RETURN_CONCURRENT_CHANGE","SALE_RETURN_REFUND_TOTAL_MISMATCH","SALE_RETURN_DELIVERY_FEE_EXCEEDED","SALE_RETURN_PAYMENT_AMOUNT_EXCEEDED"]){test(`safe message and refresh ${code}`,()=>{assert.ok(!e.returnErrorMessage(code,409).includes(code));assert.equal(e.shouldRefreshReturnBalances({code}),true);});}
test("unknown codes and SQL messages not displayed",()=>assert.equal(e.returnRequestError({isAxiosError:true,response:{status:500,data:{code:"SQLSTATE_45000",message:"SELECT secret FROM table"}}}).message,e.returnErrorMessage(undefined,500)));
test("network uncertainty preserves retry advice without balance refresh",()=>{const failure=e.returnRequestError({isAxiosError:true});assert.match(failure.message,/misma clave/);assert.equal(e.shouldRefreshReturnBalances(failure),false);});
test("UTF-8 labels preserved in all new sources",()=>{for(const file of ["RegisterSaleReturnDialog.tsx","SaleReturnDetailDialog.tsx","SaleReturnRefundsSection.tsx"]){const text=source(`../src/views/businesses-app/module/sales/components/returns/${file}`);assert.ok(!/[ÃÂ]/.test(text),file);assert.match(text,/devolución|reembolso|Reembolso/);}});

test("irrelevant draft edits do not duplicate an uncertain operation",()=>{const d=data();d.refundablePayments.push(payment(2,false));const input=draft(d);const first=h.planSaleReturn(input,d,saleItems,7).payload;const previous=h.returnSubmissionKey(null,first,()=>"first");input.refunds[1].reference="Referencia de pago no asignado";const next=h.planSaleReturn(input,d,saleItems,7).payload;assert.strictEqual(h.returnSubmissionKey(previous,next,()=>"new"),previous);});
test("restock and allocation reference edits change actual payload key",()=>{const input=draft();const payload=h.planSaleReturn(input,data(),saleItems,7).payload;const previous=h.returnSubmissionKey(null,payload,()=>"first");input.items[0].restock=false;assert.equal(h.returnSubmissionKey(previous,h.planSaleReturn(input,data(),saleItems,7).payload,()=>"restock").key,"restock");input.items[0].restock=true;input.refunds[0].reference="Referencia nueva";assert.equal(h.returnSubmissionKey(previous,h.planSaleReturn(input,data(),saleItems,7).payload,()=>"reference").key,"reference");});
