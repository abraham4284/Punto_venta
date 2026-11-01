import { Decimal } from "decimal.js";
import { randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import type { DeliveryRow, ItemRow, PaymentRow, ReturnContext, ReturnRow, SaleRow } from "../types/index.js";
import type { SaleReturnBody } from "../validations/sale-returns.validations.js";
import { calculateReturn, requestHash, returnSummary, SaleReturnError, saleReturnDatabaseError } from "../helpers/sale-returns.helper.js";
async function rows<T>(connection: PoolConnection, sql: string, values: unknown[]): Promise<T[]> {
    const [result] = await connection.query<RowDataPacket[]>(sql, values);
    return result as T[];
}
async function context(connection: PoolConnection, idBusiness: number, idSale: number): Promise<ReturnContext> {
    const [sale] = await rows<SaleRow>(connection, "SELECT * FROM sales WHERE idBusiness = ? AND idSale = ? FOR UPDATE", [idBusiness, idSale]);
    if (!sale)
        throw new SaleReturnError("SALE_RETURN_SALE_NOT_FOUND", 404);
    const [delivery] = await rows<DeliveryRow>(connection, "SELECT idSaleDelivery, status FROM sale_deliveries WHERE idBusiness = ? AND idSale = ? FOR UPDATE", [idBusiness, idSale]);
    const payments = await rows<PaymentRow>(connection, `SELECT sp.*, pm.affects_cash, pm.name AS paymentMethodName FROM sale_payments sp JOIN payment_methods pm ON pm.idBusiness = sp.idBusiness AND pm.idPaymentMethod = sp.idPaymentMethod WHERE sp.idBusiness = ? AND sp.idSale = ? ORDER BY sp.idSalePayment FOR UPDATE`, [idBusiness, idSale]);
    const items = await rows<ItemRow>(connection, `SELECT sd.*, p.unit_type, p.name AS productName, p.barcode FROM sale_details sd JOIN products p ON p.idBusiness = sd.idBusiness AND p.idProduct = sd.idProduct WHERE sd.idBusiness = ? AND sd.idSale = ? ORDER BY sd.idSaleDetail FOR UPDATE`, [idBusiness, idSale]);
    // All creators serialize on Sale. These current reads also work under REPEATABLE READ after a waiter acquires the lock.
    const previousItems = await rows<RowDataPacket>(connection, `SELECT i.idSaleDetail, i.quantity, i.refund_amount FROM sale_return_items i JOIN sale_returns r ON r.idBusiness = i.idBusiness AND r.idSaleReturn = i.idSaleReturn WHERE r.idBusiness = ? AND r.idSale = ? ORDER BY i.idSaleReturnItem FOR UPDATE`, [idBusiness, idSale]);
    const previousRefunds = await rows<RowDataPacket>(connection, `SELECT f.idSalePayment, f.amount FROM sale_refunds f JOIN sale_returns r ON r.idBusiness = f.idBusiness AND r.idSaleReturn = f.idSaleReturn WHERE r.idBusiness = ? AND r.idSale = ? ORDER BY f.idSaleRefund FOR UPDATE`, [idBusiness, idSale]);
    const previousReturns = await rows<RowDataPacket>(connection, "SELECT delivery_fee_refund FROM sale_returns WHERE idBusiness = ? AND idSale = ? ORDER BY idSaleReturn FOR UPDATE", [idBusiness, idSale]);
    for (const item of items) {
        item.returnedQuantity = sum(previousItems.filter(function match(i) { return i.idSaleDetail === item.idSaleDetail; }).map(function quantity(i) { return String(i.quantity); }));
        item.returnedAmount = sum(previousItems.filter(function match(i) { return i.idSaleDetail === item.idSaleDetail; }).map(function amount(i) { return String(i.refund_amount); }));
    }
    for (const payment of payments)
        payment.refundedAmount = sum(previousRefunds.filter(function match(f) { return f.idSalePayment === payment.idSalePayment; }).map(function amount(f) { return String(f.amount); }));
    return { sale, delivery: delivery ?? null, items, payments, deliveryRefunded: sum(previousReturns.map(function amount(r) { return String(r.delivery_fee_refund); })) };
}
function sum(values: string[]): string { return Decimal.sum(0, ...values).toFixed(2); }
async function readReturn(connection: PoolConnection, idBusiness: number, idSaleReturn: number) {
    const [row] = await rows<ReturnRow>(connection, `SELECT r.*, s.sale_number, u.name AS createdByName FROM sale_returns r JOIN sales s ON s.idBusiness = r.idBusiness AND s.idSale = r.idSale JOIN users u ON u.idUser = r.created_by_user_id WHERE r.idBusiness = ? AND r.idSaleReturn = ?`, [idBusiness, idSaleReturn]);
    if (!row)
        throw new SaleReturnError("SALE_RETURN_SALE_NOT_FOUND", 404);
    const items = await rows<RowDataPacket>(connection, `SELECT i.*, p.name AS productName, p.barcode FROM sale_return_items i JOIN products p ON p.idBusiness = i.idBusiness AND p.idProduct = i.idProduct WHERE i.idBusiness = ? AND i.idSaleReturn = ? ORDER BY i.idSaleReturnItem`, [idBusiness, idSaleReturn]);
    const refunds = await rows<RowDataPacket>(connection, `SELECT f.*, pm.name AS paymentMethodName, pm.affects_cash FROM sale_refunds f JOIN sale_payments sp ON sp.idBusiness = f.idBusiness AND sp.idSalePayment = f.idSalePayment JOIN payment_methods pm ON pm.idBusiness = sp.idBusiness AND pm.idPaymentMethod = sp.idPaymentMethod WHERE f.idBusiness = ? AND f.idSaleReturn = ? ORDER BY f.idSaleRefund`, [idBusiness, idSaleReturn]);
    return { idSaleReturn: Number(row.idSaleReturn), idSale: Number(row.idSale), returnNumber: row.return_number, saleNumber: row.sale_number, reason: row.reason, observation: row.observation,
        merchandiseAmount: Number(row.merchandise_amount), deliveryFeeRefund: Number(row.delivery_fee_refund), totalRefund: Number(row.total_refund), createdBy: { idUser: Number(row.created_by_user_id), name: row.createdByName }, createdAt: row.created_at,
        items: items.map(function map(i) { return { idSaleReturnItem: Number(i.idSaleReturnItem), idSaleDetail: Number(i.idSaleDetail), idProduct: Number(i.idProduct), productName: i.productName as string, barcode: i.barcode as string | null, quantity: Number(i.quantity), refundAmount: Number(i.refund_amount), restock: Boolean(i.restock) }; }),
        refunds: refunds.map(function map(f) { return { idSaleRefund: Number(f.idSaleRefund), idSalePayment: Number(f.idSalePayment), paymentMethodName: f.paymentMethodName as string, affectsCash: Boolean(f.affects_cash), amount: Number(f.amount), idCashSession: f.idCashSession == null ? null : Number(f.idCashSession), cashMovement: f.idCashMovement == null ? null : { idCashMovement: Number(f.idCashMovement), movementType: "EXPENSE", category: "SALE_REFUND" }, reference: f.reference as string | null, observation: f.observation as string | null }; }),
    };
}
export async function listSaleReturnsService(idBusiness: number, idSale: number) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const ctx = await context(connection, idBusiness, idSale);
        const ids = await rows<RowDataPacket>(connection, "SELECT idSaleReturn FROM sale_returns WHERE idBusiness = ? AND idSale = ? ORDER BY idSaleReturn", [idBusiness, idSale]);
        const returns = [];
        for (const row of ids)
            returns.push(await readReturn(connection, idBusiness, Number(row.idSaleReturn)));
        const result = { returns, summary: returnSummary(ctx),
            returnableItems: ctx.items.map(function map(i) { return { idSaleDetail: Number(i.idSaleDetail), product: { idProduct: Number(i.idProduct), productName: i.productName, barcode: i.barcode, unitType: i.unit_type }, soldQuantity: Number(i.quantity), returnedQuantity: Number(i.returnedQuantity), remainingQuantity: new Decimal(i.quantity).minus(i.returnedQuantity).toNumber(), remainingRefundAmount: new Decimal(i.subtotal).minus(i.returnedAmount).toNumber() }; }),
            refundablePayments: ctx.payments.map(function map(p) { return { idSalePayment: Number(p.idSalePayment), paymentMethod: { idPaymentMethod: Number(p.idPaymentMethod), name: p.paymentMethodName }, amount: Number(p.amount), alreadyRefunded: Number(p.refundedAmount), remainingRefundable: p.status === "CONFIRMED" ? new Decimal(p.amount).minus(p.refundedAmount).toNumber() : 0, affectsCash: Boolean(p.affects_cash), status: p.status }; }),
            remainingDeliveryFeeRefund: new Decimal(ctx.sale.delivery_fee).minus(ctx.deliveryRefunded).toNumber() };
        await connection.commit();
        return result;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function getSaleReturnService(idBusiness: number, idSaleReturn: number) {
    const [found] = await pool.query<RowDataPacket[]>("SELECT idSale FROM sale_returns WHERE idBusiness = ? AND idSaleReturn = ?", [idBusiness, idSaleReturn]);
    if (!found[0])
        throw new SaleReturnError("SALE_RETURN_SALE_NOT_FOUND", 404);
    const data = await listSaleReturnsService(idBusiness, Number(found[0].idSale));
    return { saleReturn: data.returns.find(function find(r) { return r.idSaleReturn === idSaleReturn; })!, summary: data.summary };
}
export async function createSaleReturnService(idBusiness: number, idUser: number, idSale: number, idempotencyKey: string, body: SaleReturnBody) {
    const connection = await pool.getConnection();
    const hash = requestHash(idSale, body);
    let idSaleReturn: number;
    let replay = false;
    try {
        await connection.beginTransaction();
        const ctx = await context(connection, idBusiness, idSale);
        const [actor] = await rows<RowDataPacket>(connection, "SELECT bu.idUser FROM business_users bu JOIN users u ON u.idUser = bu.idUser WHERE bu.idBusiness = ? AND bu.idUser = ? AND bu.is_active = 1 AND u.is_active = 1 FOR UPDATE", [idBusiness, idUser]);
        if (!actor)
            throw new SaleReturnError("SALE_RETURN_ACTOR_INVALID", 403);
        const [existing] = await rows<ReturnRow>(connection, "SELECT idSaleReturn, idSale, request_hash FROM sale_returns WHERE idBusiness = ? AND idempotency_key = ? FOR UPDATE", [idBusiness, idempotencyKey.toLowerCase()]);
        if (existing) {
            if (Number(existing.idSale) !== idSale || existing.request_hash !== hash)
                throw new SaleReturnError("IDEMPOTENCY_KEY_CONFLICT");
            idSaleReturn = Number(existing.idSaleReturn);
            replay = true;
        }
        else {
            const plan = calculateReturn(ctx, body);
            if (plan.cash) {
                const [session] = await rows<RowDataPacket>(connection, "SELECT cs.status, cr.is_active FROM cash_sessions cs JOIN cash_registers cr ON cr.idBusiness = cs.idBusiness AND cr.idCashRegister = cs.idCashRegister WHERE cs.idBusiness = ? AND cs.idCashSession = ? FOR UPDATE", [idBusiness, body.idCashSession]);
                if (!session || session.status !== "OPEN" || !session.is_active)
                    throw new SaleReturnError("SALE_RETURN_CASH_SESSION_CLOSED");
            }
            const [created] = await connection.query<ResultSetHeader>(`INSERT INTO sale_returns (idBusiness, idSale, return_number, idempotency_key, request_hash, merchandise_amount, delivery_fee_refund, total_refund, reason, observation, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [idBusiness, idSale, `RET-${randomUUID()}`, idempotencyKey.toLowerCase(), hash, plan.merchandise, body.deliveryFeeRefund, plan.total, body.reason, body.observation ?? null, idUser]);
            idSaleReturn = created.insertId;
            for (const item of [...plan.items].sort(function sort(a, b) { return a.idProduct - b.idProduct; })) {
                await connection.query("CALL sp_sale_return_apply_item(?, ?, ?, ?, ?, ?, ?)", [idBusiness, idSaleReturn, item.idSaleDetail, item.quantity, item.refundAmount, item.restock ? 1 : 0, idUser]);
            }
            for (const refund of [...plan.refunds].sort(function sort(a, b) { return a.idSalePayment - b.idSalePayment; })) {
                let idCashMovement: number | null = null;
                if (refund.affectsCash) {
                    const [movement] = await connection.query<ResultSetHeader>("INSERT INTO cash_movements (idBusiness, idCashSession, idUser, movement_type, category, amount, description) VALUES (?, ?, ?, 'EXPENSE', 'SALE_REFUND', ?, ?)", [idBusiness, body.idCashSession, idUser, refund.amount, `Sale ${idSale} / SaleReturn ${idSaleReturn}`]);
                    idCashMovement = movement.insertId;
                }
                const [createdRefund] = await connection.query<ResultSetHeader>("INSERT INTO sale_refunds (idBusiness, idSaleReturn, idSalePayment, amount, idCashSession, idCashMovement, reference, observation, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [idBusiness, idSaleReturn, refund.idSalePayment, refund.amount, refund.affectsCash ? body.idCashSession : null, idCashMovement, refund.reference ?? null, refund.observation ?? null, idUser]);
                await connection.query("INSERT INTO sale_payment_events (idBusiness, idSalePayment, event_type, previous_status, new_status, metadata, created_by_user_id) VALUES (?, ?, 'PAYMENT_REFUNDED', 'CONFIRMED', 'CONFIRMED', ?, ?)", [idBusiness, refund.idSalePayment, JSON.stringify({ idSaleReturn, idSaleRefund: createdRefund.insertId, amount: refund.amount, idCashMovement }), idUser]);
            }
            if (plan.cancelDelivery && ctx.delivery) {
                await connection.query("UPDATE sale_deliveries SET status = 'CANCELLED', cancelled_at = NOW() WHERE idBusiness = ? AND idSaleDelivery = ?", [idBusiness, ctx.delivery.idSaleDelivery]);
                await connection.query("INSERT INTO delivery_events (idBusiness, idSaleDelivery, event_type, previous_status, new_status, metadata, created_by_user_id) VALUES (?, ?, 'DELIVERY_CANCELLED', ?, 'CANCELLED', ?, ?)", [idBusiness, ctx.delivery.idSaleDelivery, ctx.delivery.status, JSON.stringify({ reason: "full sale return", idSaleReturn }), idUser]);
            }
        }
        await connection.commit();
    }
    catch (error) {
        await connection.rollback();
        const db = error as {
            code?: string;
        };
        if (db.code === "ER_DUP_ENTRY")
            throw new SaleReturnError("IDEMPOTENCY_KEY_CONFLICT");
        if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(db.code ?? ""))
            throw new SaleReturnError("SALE_RETURN_CONCURRENT_CHANGE");
        throw saleReturnDatabaseError(error) ?? error;
    }
    finally {
        connection.release();
    }
    // Response reads are post-commit. A lost response is recovered with the same UUID/body.
    return { ...await getSaleReturnService(idBusiness, idSaleReturn), idempotentReplay: replay };
}
