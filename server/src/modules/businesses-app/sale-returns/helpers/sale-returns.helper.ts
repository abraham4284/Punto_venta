import { Decimal as DecimalJs } from "decimal.js";
const Decimal = DecimalJs.clone({ precision: 40, rounding: DecimalJs.ROUND_HALF_UP });
import { createHash } from "node:crypto";
import type { ReturnContext } from "../types/index.js";
import type { SaleReturnBody } from "../validations/sale-returns.validations.js";
export class SaleReturnError extends Error {
    constructor(public code: string, public statusCode = 409) { super(messages[code] ?? "No se pudo procesar la devolucion"); }
}
const messages: Record<string, string> = {
    SALE_RETURN_SALE_NOT_FOUND: "Venta no encontrada", SALE_RETURN_SALE_CANCELLED: "La venta no admite devoluciones",
    SALE_RETURN_DELIVERY_IN_TRANSIT: "Resuelva el reparto en curso antes de devolver",
    SALE_RETURN_PENDING_PAYMENT_MUST_BE_RESOLVED: "Debe resolver los pagos pendientes",
    SALE_RETURN_COLLECTED_PAYMENT_MUST_BE_SETTLED: "Debe rendir los pagos cobrados",
    SALE_RETURN_PAYMENT_COVERAGE_REQUIRED: "Los pagos confirmados deben cubrir la venta original",
    SALE_RETURN_ITEM_NOT_FOUND: "Linea de venta no encontrada", SALE_RETURN_QUANTITY_EXCEEDED: "La cantidad supera el saldo retornable",
    SALE_RETURN_INVALID_UNIT_QUANTITY: "Los productos por unidad requieren cantidades enteras",
    SALE_RETURN_DELIVERY_FEE_EXCEEDED: "El reembolso de envio supera el saldo disponible",
    SALE_RETURN_PAYMENT_NOT_FOUND: "Pago original no encontrado", SALE_RETURN_PAYMENT_NOT_CONFIRMED: "Solo puede reembolsar pagos confirmados",
    SALE_RETURN_PAYMENT_AMOUNT_EXCEEDED: "El reembolso supera el saldo del pago", SALE_RETURN_REFUND_TOTAL_MISMATCH: "Los reembolsos deben sumar exactamente el importe de la devolucion",
    SALE_RETURN_CASH_SESSION_REQUIRED: "Seleccione una caja actual para reembolsar efectivo", SALE_RETURN_CASH_SESSION_CLOSED: "La caja debe estar abierta y activa en el negocio",
    SALE_RETURN_CASH_SESSION_NOT_ALLOWED: "Un reembolso sin efectivo no utiliza caja", SALE_RETURN_ACTOR_INVALID: "Usuario no habilitado en el negocio",
    IDEMPOTENCY_KEY_CONFLICT: "La clave ya corresponde a otra devolucion", SALE_RETURN_CONCURRENT_CHANGE: "Cambio concurrente; reintente la operacion",
};
export function requestHash(idSale: number, body: SaleReturnBody): string {
    return createHash("sha256").update(JSON.stringify({ idSale, reason: body.reason, observation: body.observation ?? null, deliveryFeeRefund: body.deliveryFeeRefund, idCashSession: body.idCashSession ?? null,
        items: [...body.items].sort(function sort(a, b) { return a.idSaleDetail - b.idSaleDetail; }),
        refunds: [...body.refunds].sort(function sort(a, b) { return a.idSalePayment - b.idSalePayment; }).map(function refund(r) { return { ...r, reference: r.reference ?? null, observation: r.observation ?? null }; }),
    })).digest("hex");
}
export function returnSummary(ctx: ReturnContext) {
    const merchandise = Decimal.sum(0, ...ctx.items.map(function amount(i) { return i.returnedAmount; }));
    const refunded = Decimal.sum(0, ...ctx.payments.map(function amount(p) { return p.refundedAmount; }));
    const returned = ctx.items.some(function any(i) { return new Decimal(i.returnedQuantity).gt(0); });
    const full = ctx.items.length > 0 && ctx.items.every(function all(i) { return new Decimal(i.returnedQuantity).eq(i.quantity); });
    return { returnStatus: full ? "FULL" : returned ? "PARTIAL" : "NONE", refundStatus: refunded.eq(ctx.sale.total) && refunded.gt(0) ? "FULL" : refunded.gt(0) ? "PARTIAL" : "NONE",
        returnedMerchandiseAmount: merchandise.toNumber(), refundedDeliveryFee: Number(ctx.deliveryRefunded), refundedTotal: refunded.toNumber(), netSaleAmount: new Decimal(ctx.sale.total).minus(refunded).toNumber() };
}
export function calculateReturn(ctx: ReturnContext, body: SaleReturnBody) {
    if (ctx.sale.status !== "COMPLETED")
        throw new SaleReturnError("SALE_RETURN_SALE_CANCELLED");
    if (ctx.delivery?.status === "OUT_FOR_DELIVERY")
        throw new SaleReturnError("SALE_RETURN_DELIVERY_IN_TRANSIT");
    if (ctx.payments.some(function pending(p) { return p.status === "PENDING"; }))
        throw new SaleReturnError("SALE_RETURN_PENDING_PAYMENT_MUST_BE_RESOLVED");
    if (ctx.payments.some(function collected(p) { return p.status === "COLLECTED"; }))
        throw new SaleReturnError("SALE_RETURN_COLLECTED_PAYMENT_MUST_BE_SETTLED");
    if (Decimal.sum(0, ...ctx.payments.filter(function confirmed(p) { return p.status === "CONFIRMED"; }).map(function amount(p) { return p.amount; })).lt(ctx.sale.total))
        throw new SaleReturnError("SALE_RETURN_PAYMENT_COVERAGE_REQUIRED");
    const items = body.items.map(function calculate(input) {
        const row = ctx.items.find(function find(i) { return i.idSaleDetail === input.idSaleDetail; });
        if (!row)
            throw new SaleReturnError("SALE_RETURN_ITEM_NOT_FOUND", 400);
        if (row.unit_type === "UNIT" && !Number.isInteger(input.quantity))
            throw new SaleReturnError("SALE_RETURN_INVALID_UNIT_QUANTITY", 400);
        const remainingQuantity = new Decimal(row.quantity).minus(row.returnedQuantity);
        const remainingAmount = new Decimal(row.subtotal).minus(row.returnedAmount);
        if (new Decimal(input.quantity).gt(remainingQuantity))
            throw new SaleReturnError("SALE_RETURN_QUANTITY_EXCEEDED");
        const refundAmount = remainingQuantity.eq(input.quantity) ? remainingAmount : Decimal.min(remainingAmount, new Decimal(row.subtotal).mul(input.quantity).div(row.quantity).toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
        return { ...input, idProduct: row.idProduct, refundAmount: refundAmount.toFixed(2) };
    });
    if (new Decimal(body.deliveryFeeRefund).plus(ctx.deliveryRefunded).gt(ctx.sale.delivery_fee))
        throw new SaleReturnError("SALE_RETURN_DELIVERY_FEE_EXCEEDED");
    const merchandise = Decimal.sum(0, ...items.map(function amount(i) { return i.refundAmount; }));
    const total = merchandise.plus(body.deliveryFeeRefund);
    let cash = false;
    const refunds = body.refunds.map(function calculate(input) {
        const row = ctx.payments.find(function find(p) { return p.idSalePayment === input.idSalePayment; });
        if (!row)
            throw new SaleReturnError("SALE_RETURN_PAYMENT_NOT_FOUND", 400);
        if (row.status !== "CONFIRMED")
            throw new SaleReturnError("SALE_RETURN_PAYMENT_NOT_CONFIRMED");
        if (new Decimal(row.refundedAmount).plus(input.amount).gt(row.amount))
            throw new SaleReturnError("SALE_RETURN_PAYMENT_AMOUNT_EXCEEDED");
        if (Boolean(row.affects_cash))
            cash = true;
        return { ...input, affectsCash: Boolean(row.affects_cash) };
    });
    if (!Decimal.sum(0, ...refunds.map(function amount(r) { return r.amount; })).eq(total))
        throw new SaleReturnError("SALE_RETURN_REFUND_TOTAL_MISMATCH", 400);
    if (cash && !body.idCashSession)
        throw new SaleReturnError("SALE_RETURN_CASH_SESSION_REQUIRED");
    if (!cash && body.idCashSession != null)
        throw new SaleReturnError("SALE_RETURN_CASH_SESSION_NOT_ALLOWED", 400);
    const full = ctx.items.every(function complete(row) { const added = items.find(function find(i) { return i.idSaleDetail === row.idSaleDetail; }); return new Decimal(row.returnedQuantity).plus(added?.quantity ?? 0).eq(row.quantity); });
    return { items, refunds, merchandise: merchandise.toFixed(2), total: total.toFixed(2), cash, cancelDelivery: full && ["PENDING", "ASSIGNED", "FAILED"].includes(ctx.delivery?.status ?? "") };
}
export function saleReturnDatabaseError(error: unknown): SaleReturnError | null {
    const code = (error as {
        sqlMessage?: string;
    } | null)?.sqlMessage;
    return code && Object.hasOwn(messages, code) ? new SaleReturnError(code) : null;
}
