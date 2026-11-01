import { beforeEach, it, expect, vi } from "vitest";
const db = vi.hoisted(function setup() { return { query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(), getConnection: vi.fn(), poolQuery: vi.fn() }; });
vi.mock("@/db/db.js", function pool() { return { pool: { getConnection: db.getConnection, query: db.poolQuery } }; });
import { createSaleReturnService } from "@/modules/businesses-app/sale-returns/services/sale-returns.service.js";
import { requestHash } from "@/modules/businesses-app/sale-returns/helpers/sale-returns.helper.js";
import { saleReturnBodySchema } from "@/modules/businesses-app/sale-returns/validations/sale-returns.validations.js";
const key = "00000000-0000-4000-8000-000000000001";
function body() { return saleReturnBodySchema.parse({ reason: "Devolucion", items: [{ idSaleDetail: 1, quantity: 2, restock: true }], refunds: [{ idSalePayment: 1, amount: 10 }], idCashSession: 4 }); }
let cash = true, fail = false, actor = true, closed = false, replay: Record<string, unknown> | null = null;
beforeEach(function reset() {
    vi.resetAllMocks();
    cash = true;
    fail = false;
    actor = true;
    closed = false;
    replay = null;
    db.getConnection.mockResolvedValue(db);
    db.poolQuery.mockResolvedValue([[{ idSale: 1 }]]);
    db.query.mockImplementation(async function query(sql: string, params: unknown[]) {
        if (sql.startsWith("SELECT * FROM sales"))
            return [[{ idSale: 1, idDeposit: 2, total: "10", delivery_fee: "0", status: "COMPLETED" }]];
        if (sql.startsWith("SELECT idSaleDelivery"))
            return [[{ idSaleDelivery: 2, status: "ASSIGNED" }]];
        if (sql.startsWith("SELECT sp.*"))
            return [[{ idSalePayment: 1, amount: "10", status: "CONFIRMED", affects_cash: cash ? 1 : 0, idCashSettlement: 99 }]];
        if (sql.startsWith("SELECT sd.*"))
            return [[{ idSaleDetail: 1, idProduct: 3, quantity: "2", subtotal: "10", unit_type: "UNIT" }]];
        if (sql.startsWith("SELECT bu.idUser"))
            return [actor ? [{ idUser: 2 }] : []];
        if (sql.startsWith("SELECT idSaleReturn, idSale, request_hash"))
            return [replay ? [replay] : []];
        if (sql.startsWith("SELECT cs.status"))
            return [[{ status: closed ? "CLOSED" : "OPEN", is_active: 1 }]];
        if (sql.startsWith("INSERT INTO sale_refunds") && fail)
            throw new Error("injected refund failure");
        if (sql.startsWith("INSERT"))
            return [{ insertId: 5 }];
        if (sql.startsWith("SELECT idSaleReturn FROM"))
            return [[{ idSaleReturn: 5 }]];
        if (sql.startsWith("SELECT r.*"))
            return [[{ idSaleReturn: 5, idSale: 1, merchandise_amount: "10", delivery_fee_refund: "0", total_refund: "10", created_by_user_id: 2 }]];
        if (sql.includes("sale_return_items") || sql.includes("sale_refunds") || sql.startsWith("SELECT delivery_fee_refund"))
            return [[]];
        return [[]];
    });
});
it("all economic writes share one owner; cash refund EXPENSE + event and full predispatch cancel", async function create() { const result = await createSaleReturnService(7, 2, 1, key, body()); expect(result.idempotentReplay).toBe(false); expect(db.commit).toHaveBeenCalledTimes(2); expect(db.release).toHaveBeenCalledTimes(2); const calls = db.query.mock.calls; expect(calls.some(function cash(c) { return String(c[0]).includes("'EXPENSE', 'SALE_REFUND'"); })).toBe(true); expect(calls.some(function event(c) { return String(c[0]).includes("'PAYMENT_REFUNDED', 'CONFIRMED', 'CONFIRMED'"); })).toBe(true); expect(calls.some(function delivery(c) { return String(c[0]).startsWith("UPDATE sale_deliveries"); })).toBe(true); expect(calls.some(function history(c) { return /UPDATE (sales|orders|sale_payments|cash_settlements)/.test(String(c[0])); })).toBe(false); for (const c of calls.filter(function write(c) { return /^(INSERT|UPDATE|CALL)/.test(String(c[0])); }))
    expect(c[1][0]).toBe(7); });
it("noncash refund has NULL cash linkage and no movement", async function noncash() { cash = false; const input = body(); input.idCashSession = null; await createSaleReturnService(7, 2, 1, key, input); expect(db.query.mock.calls.some(function movement(c) { return String(c[0]).startsWith("INSERT INTO cash_movements"); })).toBe(false); const refund = db.query.mock.calls.find(function refund(c) { return String(c[0]).startsWith("INSERT INTO sale_refunds"); }); expect(refund?.[1].slice(4, 6)).toEqual([null, null]); });
it("refund failure rolls back prior stock/cash writes and releases", async function atomic() { fail = true; await expect(createSaleReturnService(7, 2, 1, key, body())).rejects.toThrow("injected"); expect(db.rollback).toHaveBeenCalledOnce(); expect(db.commit).not.toHaveBeenCalled(); expect(db.release).toHaveBeenCalledOnce(); });
it("same key+hash replay does not write again", async function replayCase() { replay = { idSale: 1, idSaleReturn: 5, request_hash: requestHash(1, body()) }; expect((await createSaleReturnService(7, 2, 1, key, body())).idempotentReplay).toBe(true); expect(db.query.mock.calls.filter(function writes(c) { return /^(INSERT|UPDATE|CALL)/.test(String(c[0])); })).toHaveLength(0); });
it("key collision rejects changed body or different sale", async function conflict() { replay = { idSale: 1, idSaleReturn: 5, request_hash: "different" }; await expect(createSaleReturnService(7, 2, 1, key, body())).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_CONFLICT" }); });
it("inactive actor fails before mutation", async function inactive() { actor = false; await expect(createSaleReturnService(7, 2, 1, key, body())).rejects.toMatchObject({ statusCode: 403 }); expect(db.commit).not.toHaveBeenCalled(); });
it("closed current session fails before mutation", async function session() { closed = true; await expect(createSaleReturnService(7, 2, 1, key, body())).rejects.toMatchObject({ code: "SALE_RETURN_CASH_SESSION_CLOSED" }); expect(db.query.mock.calls.some(function writes(c) { return String(c[0]).startsWith("INSERT"); })).toBe(false); });
it("locks sale then delivery/payments/details and reads previous allocations FOR UPDATE", async function locks() { await createSaleReturnService(7, 2, 1, key, body()); const calls = db.query.mock.calls; expect(String(calls[0]![0])).toContain("FROM sales"); expect(String(calls[1]![0])).toContain("FROM sale_deliveries"); expect(String(calls[2]![0])).toContain("ORDER BY sp.idSalePayment FOR UPDATE"); expect(String(calls[3]![0])).toContain("ORDER BY sd.idSaleDetail FOR UPDATE"); for (const c of calls.slice(4, 7))
    expect(String(c[0])).toContain("FOR UPDATE"); });
it("missing or foreign sale cannot mutate", async function tenant() { db.query.mockResolvedValueOnce([[]]); await expect(createSaleReturnService(7, 2, 1, key, body())).rejects.toMatchObject({ code: "SALE_RETURN_SALE_NOT_FOUND", statusCode: 404 }); expect(db.rollback).toHaveBeenCalledOnce(); expect(db.query).toHaveBeenCalledWith("SELECT * FROM sales WHERE idBusiness = ? AND idSale = ? FOR UPDATE", [7, 1]); });
it("SQL invariant failure is mapped safely and fully rolled back", async function sqlFailure() { const original = db.query.getMockImplementation()!; db.query.mockImplementation(async function injected(sql: string, params: unknown[]) { if (sql.startsWith("CALL sp_sale_return_apply_item"))
    throw { sqlMessage: "SALE_RETURN_QUANTITY_EXCEEDED" }; return original(sql, params); }); await expect(createSaleReturnService(7, 2, 1, key, body())).rejects.toMatchObject({ code: "SALE_RETURN_QUANTITY_EXCEEDED" }); expect(db.rollback).toHaveBeenCalledOnce(); expect(db.commit).not.toHaveBeenCalled(); });
