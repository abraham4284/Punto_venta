import { Decimal as DecimalJs } from "decimal.js";
import { z } from "zod";
import { createIdempotencyKey } from "@/helpers/idempotency.helper";
import type { SaleDetailResponse, SaleWithDetailsResponse } from "../types";
import type { RefundablePayment, ReturnableItem, SaleReturnDraft, SaleReturnPayload, SaleReturnsData, ReturnStatus } from "../types/sale-returns.types";
const Decimal = DecimalJs.clone({ precision: 40, rounding: DecimalJs.ROUND_HALF_UP });
export const returnLabels: Record<ReturnStatus,string> = { NONE: "Sin devoluciones", PARTIAL: "Devolución parcial", FULL: "Devolución completa" };
export const refundLabels: Record<ReturnStatus,string> = { NONE: "Sin reembolsos", PARTIAL: "Reembolso parcial", FULL: "Reembolso completo" };
export const saleHasReturnsReason = "Esta venta ya tiene devoluciones registradas y no puede anularse.";
const number = (value: string, empty = false): DecimalJs | null => {
  if (!value.trim() && empty) return new Decimal(0);
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const result = new Decimal(value.trim()); return result.isFinite() ? result : null;
};
export const returnQuantityError = (value: string, row: ReturnableItem) => {
  const qty = number(value);
  if (!qty || qty.lte(0) || qty.gt(999999999)) return "Ingresá una cantidad positiva con hasta dos decimales.";
  if (row.product.unitType === "UNIT" && !qty.isInteger()) return "Este producto requiere una cantidad entera.";
  return qty.gt(row.remainingQuantity) ? "La cantidad supera el saldo disponible." : null;
};
export const previewReturnItem = (quantity: string, row: ReturnableItem, saleItem?: Pick<SaleDetailResponse,"total">): number | null => {
  if (returnQuantityError(quantity,row) || !saleItem || row.soldQuantity <= 0) return null;
  const qty = new Decimal(quantity);
  return (qty.eq(row.remainingQuantity) ? new Decimal(row.remainingRefundAmount) : Decimal.min(row.remainingRefundAmount, new Decimal(saleItem.total).mul(qty).div(row.soldQuantity).toDecimalPlaces(2))).toNumber();
};
export const autoAllocateRefunds = (total: number, payments: RefundablePayment[]) => {
  let remaining = new Decimal(total);
  return payments.map((payment) => {
    const amount = payment.status === "CONFIRMED" ? Decimal.min(remaining,Decimal.max(0,payment.remainingRefundable)) : new Decimal(0);
    remaining = remaining.minus(amount);
    return { idSalePayment: payment.idSalePayment, amount: amount.toFixed(2) };
  });
};
export const initialReturnDraft = (data: SaleReturnsData): SaleReturnDraft => ({ reason: "", observation: "", deliveryFeeRefund: "0", manualRefunds: false,
  items: data.returnableItems.map((row) => ({ idSaleDetail: row.idSaleDetail, selected: false, quantity: String(row.remainingQuantity), restock: true })),
  refunds: data.refundablePayments.map((row) => ({ idSalePayment: row.idSalePayment, amount: "0", reference: "", observation: "" })),
});
const money = z.number().finite().min(0).max(999999999999.99).multipleOf(0.01);
const payloadSchema = z.object({
  reason: z.string().trim().min(3,"Escribí un motivo de al menos 3 caracteres.").max(500), observation: z.string().trim().max(500).nullable(), deliveryFeeRefund: money,
  items: z.array(z.object({idSaleDetail:z.number().int().positive(),quantity:z.number().positive().max(999999999).multipleOf(0.01),restock:z.boolean()}).strict()).max(100),
  refunds: z.array(z.object({idSalePayment:z.number().int().positive(),amount:money.positive(),reference:z.string().trim().max(150).nullable(),observation:z.string().trim().max(500).nullable()}).strict()).max(5,"Solo se pueden asignar hasta cinco pagos."),
  idCashSession:z.number().int().positive().nullable(),
}).strict();
export const planSaleReturn = (draft: SaleReturnDraft, data: SaleReturnsData, saleItems: SaleDetailResponse[], idCashSession: number | null) => {
  const errors: Record<string,string> = {};
  let merchandise = new Decimal(0);
  const items = draft.items.filter((row) => row.selected).map((row) => {
    const current = data.returnableItems.find((item) => item.idSaleDetail === row.idSaleDetail);
    const amount = current ? previewReturnItem(row.quantity,current,saleItems.find((item) => item.idSaleDetail === row.idSaleDetail)) : null;
    if (amount == null) errors[`items.${row.idSaleDetail}.quantity`] = current ? returnQuantityError(row.quantity,current) ?? "No se pudo obtener el importe histórico de la línea." : "Actualizá los saldos de esta línea.";
    merchandise = merchandise.plus(amount ?? 0);
    return {idSaleDetail:row.idSaleDetail,quantity:number(row.quantity)?.toNumber() ?? NaN,restock:row.restock};
  });
  const fee = number(draft.deliveryFeeRefund,true);
  if (!fee || fee.gt(data.remainingDeliveryFeeRefund)) errors.deliveryFeeRefund = "Ingresá un envío válido, sin superar el saldo y con hasta dos decimales.";
  const total = merchandise.plus(fee ?? 0);
  const auto = autoAllocateRefunds(total.toNumber(),data.refundablePayments);
  const allocations = data.refundablePayments.map((payment) => {
    const row = draft.refunds.find((r) => r.idSalePayment === payment.idSalePayment);
    const value = draft.manualRefunds ? row?.amount ?? "0" : auto.find((r) => r.idSalePayment === payment.idSalePayment)?.amount ?? "0";
    const amount = number(value,true);
    if (!amount || amount.gt(payment.remainingRefundable) || (amount.gt(0) && payment.status !== "CONFIRMED")) errors[`refunds.${payment.idSalePayment}.amount`] = "El importe debe ser válido y no superar el saldo confirmado.";
    return {idSalePayment:payment.idSalePayment,amount:amount?.toNumber() ?? 0,reference:row?.reference.trim() || null,observation:row?.observation.trim() || null};
  });
  const refunds = allocations.filter((row) => new Decimal(row.amount).gt(0));
  const assigned = Decimal.sum(0,...refunds.map((row) => row.amount));
  const remaining = total.minus(assigned);
  if (!remaining.eq(0)) errors.refunds = "El total asignado debe coincidir exactamente con el total a reembolsar.";
  if (!items.length && (!fee || fee.lte(0))) errors.items = "Seleccioná un producto o un importe de envío.";
  const hasCash = refunds.some((row) => data.refundablePayments.some((p) => p.idSalePayment === row.idSalePayment && p.affectsCash));
  if (hasCash && !idCashSession) errors.idCashSession = "Se requiere una caja actual abierta para devolver efectivo.";
  const payload: SaleReturnPayload = {reason:draft.reason.trim(),observation:draft.observation.trim() || null,deliveryFeeRefund:fee?.toNumber() ?? NaN,items,refunds,idCashSession:hasCash?idCashSession:null};
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) for (const issue of parsed.error.issues) errors[issue.path.join(".")] ??= issue.message;
  return { payload: parsed.success ? parsed.data : payload, valid: parsed.success && !Object.keys(errors).length, errors, merchandise:merchandise.toNumber(), total:total.toNumber(),assigned:assigned.toNumber(),remaining:remaining.toNumber(),hasCash,allocations };
};
export const saleReturnBlocker = (sale: Pick<SaleWithDetailsResponse,"status"|"delivery"|"total">, data: SaleReturnsData): string | null => {
  if (sale.status !== "COMPLETED") return "Una venta anulada no admite devoluciones.";
  if (sale.delivery?.status === "OUT_FOR_DELIVERY") return "La entrega está en camino. Resolvé primero el estado de la entrega.";
  if (data.refundablePayments.some((p) => p.status === "PENDING" || p.status === "COLLECTED")) return "Resolvé primero los pagos pendientes/cobrados antes de registrar la devolución.";
  if (Decimal.sum(0,...data.refundablePayments.filter((p) => p.status === "CONFIRMED").map((p) => p.amount)).lt(sale.total)) return "Los pagos confirmados deben cubrir el total original de la venta.";
  return null;
};
export const hasReturnableBalance = (data: SaleReturnsData) => data.returnableItems.some((i) => i.remainingQuantity > 0) || data.remainingDeliveryFeeRefund > 0;
export const returnSubmissionKey = (previous: { fingerprint:string;key:string } | null, payload: SaleReturnPayload, createKey=createIdempotencyKey) => {
  const fingerprint = JSON.stringify(payload); return previous?.fingerprint === fingerprint ? previous : {fingerprint,key:createKey()};
};
