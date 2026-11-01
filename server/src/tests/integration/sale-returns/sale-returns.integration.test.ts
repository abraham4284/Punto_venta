import { createPaymentMethodFixture } from "@/tests/fixtures/payment-method.fixture.js";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { executeMutation, querySingleRow, validateTestDatabaseEnvironment } from "@/tests/helpers/test-database.helper.js";
import { countRows } from "@/tests/helpers/economic-db-test.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";
import { createCustomerFixture } from "@/tests/fixtures/customer.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import { createCashSessionFixture } from "@/tests/fixtures/cash-session.fixture.js";
import type { OrderConversionBody } from "@/modules/businesses-app/orders/validations/order-conversion.validations.js";
const runTag = `f8test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
type Scenario = Awaited<ReturnType<typeof scenario>>;
let a: Scenario, b: Scenario;
async function assertTestConnection() {
    validateTestDatabaseEnvironment();
    if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? ""))
        throw new Error("F8: test loopback exclusively");
    const identity = await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db");
    if (identity?.db !== "punto_venta_integration_test")
        throw new Error("F8: unexpected selected database");
}
async function scenario(label: string) {
    const business = await createOperationalBusinessFixture(`${runTag}_${label}`);
    const idBusiness = business.business.idBusiness;
    const customer = await createCustomerFixture(idBusiness);
    const category = await createProductCategoryFixture(idBusiness);
    const product = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 100 });
    const zero = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 0 });
    await executeMutation("UPDATE products SET sale_mode = 'ON_ORDER' WHERE idBusiness = ? AND idProduct = ?", [idBusiness, zero.idProduct]);
    const cash = await createCashSessionFixture({ idBusiness, idCashRegister: business.defaultCashRegister.idCashRegister, idUser: business.owner.idUser });
    return { business, customer, product, zero, cash };
}
function api(method: "post" | "get" | "patch", path: string, cookies = a.business.auth.cookies) {
    return request(getTestApp())[method](`/api${path}`).set("Cookie", cookies).set("X-CSRF-Protection", "1");
}
async function ready(delivery = false, idProduct?: number) {
    const result = await api("post", "/orders").set("Idempotency-Key", randomUUID()).send({
        idCustomer: a.customer.idCustomer, idDeposit: a.business.defaultDeposit.idDeposit, expectedPaymentMethodId: a.business.cashPaymentMethod.idPaymentMethod,
        fulfillmentType: delivery ? "DELIVERY" : "PICKUP", deliveryFee: delivery ? 4 : 0, subtotal: 40, discountTotal: 2, total: delivery ? 42 : 38,
        ...(delivery ? { delivery: { recipientName: "Destinatario del pedido", recipientPhone: "001122", address: "Calle de Order 123", reference: "Porton verde" } } : {}),
        items: [{ idProduct: idProduct ?? a.product.idProduct, quantity: 2, unitPrice: 20, discount: 2, total: 38 }],
    });
    expect(result.status, result.text).toBe(201);
    const id = Number(result.body.data.idOrder);
    for (const status of ["CONFIRMED", "PREPARING", "READY"]) {
        const step = await api("patch", `/orders/${id}/status`).send({ status });
        expect(step.status, step.text).toBe(200);
    }
    return id;
}
function conversion(delivery = false): OrderConversionBody { return { idCashSession: a.cash.idCashSession, payments: [{ idPaymentMethod: a.business.cashPaymentMethod.idPaymentMethod, amount: delivery ? 42 : 38, status: delivery ? "PENDING" : "CONFIRMED" }] }; }
function convert(id: number, body: OrderConversionBody = conversion(), key = randomUUID(), cookies = a.business.auth.cookies) { return api("post", `/orders/${id}/convert-to-sale`, cookies).set("Idempotency-Key", key).send(body); }
async function quantity() { const stock = await querySingleRow<RowDataPacket>("SELECT quantity FROM stock WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?", [a.business.business.idBusiness, a.product.idProduct, a.business.defaultDeposit.idDeposit]); return Number(stock?.quantity); }
async function effectCounts() {
    const counts: Record<string, number> = {};
    for (const table of ["sales", "sale_details", "sale_payments", "sale_payment_events", "sale_deliveries", "delivery_events", "stock_movements", "cash_movements", "order_events"])
        counts[table] = await countRows(table, "idBusiness = ?", [a.business.business.idBusiness]);
    return counts;
}
async function assertNoConversion(id: number, before: Record<string, number>, stock: number) {
    expect(await effectCounts()).toEqual(before);
    expect(await quantity()).toBe(stock);
    const detail = await api("get", `/orders/${id}`);
    expect(detail.body.data).toMatchObject({ status: "READY", linkedSale: null });
}
async function cleanupOwnFixtures(): Promise<void> {
    await assertTestConnection();
    const prefix = `negocio-${runTag}`;
    const [tenants] = await pool.query<RowDataPacket[]>("SELECT idBusiness FROM businesses WHERE LEFT(slug, ?) = ?", [prefix.length, prefix]);
    const [users] = await pool.query<RowDataPacket[]>("SELECT idUser FROM users WHERE LEFT(username, ?) = ?", [runTag.length, runTag]);
    const ids = tenants.map(function id(row) { return Number(row.idBusiness); });
    const userIds = users.map(function id(row) { return Number(row.idUser); });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (ids.length) {
            await connection.query("DELETE nr FROM notification_recipients nr JOIN notifications n ON n.idNotification = nr.idNotification WHERE n.idBusiness IN (?)", [ids]);
            await connection.query("DELETE e FROM subscription_events e JOIN business_subscriptions s ON s.idBusinessSubscription = e.idBusinessSubscription WHERE s.idBusiness IN (?)", [ids]);
            await connection.query("DELETE p FROM subscription_payments p JOIN business_subscriptions s ON s.idBusinessSubscription = p.idBusinessSubscription WHERE s.idBusiness IN (?)", [ids]);
            // Dependency order; every deletion is restricted to UUID-tagged tenants.
            for (const table of ["sale_refunds", "sale_return_items", "sale_returns", "order_events", "order_details", "delivery_events", "sale_payment_events", "sale_deliveries", "sale_payments", "cash_settlements", "sale_details", "sales", "orders", "purchase_details", "purchases", "stock_movements", "cash_movements", "cash_session_payment_summaries", "cash_sessions", "stock", "product_images", "products", "product_categories", "customers", "suppliers", "deposits", "cash_registers", "payment_methods", "notifications", "legal_acceptances", "business_user_permissions", "business_subscriptions", "platform_audit_logs", "user_sessions", "business_users"]) {
                await connection.query(`DELETE FROM \`${table}\` WHERE idBusiness IN (?)`, [ids]);
            }
            await connection.query("DELETE FROM businesses WHERE idBusiness IN (?)", [ids]);
        }
        if (userIds.length) {
            await connection.query("DELETE FROM notification_recipients WHERE idUser IN (?)", [userIds]);
            await connection.query("DELETE FROM user_sessions WHERE idUser IN (?)", [userIds]);
            await connection.query("DELETE FROM users WHERE idUser IN (?)", [userIds]);
        }
        await connection.commit();
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
    expect(await countRows("businesses", "LEFT(slug, ?) = ?", [prefix.length, prefix])).toBe(0);
    expect(await countRows("users", "LEFT(username, ?) = ?", [runTag.length, runTag])).toBe(0);
    console.info(`F8 cleanup OK: ${runTag}, tenants=${ids.length}, users=${userIds.length}, FK checks preserved`);
}
async function directSale(provider: Record<string, unknown>, confirmed = false, methodId?: number) {
    const result = await api("post", "/sales").set("Idempotency-Key", randomUUID()).send({
        idCustomer: a.customer.idCustomer, idDeposit: a.business.defaultDeposit.idDeposit,
        idCashSession: a.cash.idCashSession, subtotal: 40, discountTotal: 2, deliveryFee: 4, total: 42,
        payments: [{ idPaymentMethod: methodId ?? a.business.cashPaymentMethod.idPaymentMethod, amount: 42, status: confirmed ? "CONFIRMED" : "PENDING" }],
        items: [{ idProduct: a.product.idProduct, quantity: 2, unitPrice: 20, discount: 2, total: 38 }],
        delivery: { recipientName: "Destinatario F7", deliveryAddress: "Calle F7 123", ...provider },
    });
    expect(result.status, result.text).toBe(201);
    return result.body.data;
}
const third = { providerType: "THIRD_PARTY", externalProviderName: "Uber", externalReference: "F7-REF", externalCost: 12.5 };
let courier: Awaited<ReturnType<typeof createBusinessUserFixture>>;
let foreignCourier: Awaited<ReturnType<typeof createBusinessUserFixture>>;
async function balance(sale: {
    idSale: number;
}) {
    const r = await api("get", `/sales/${sale.idSale}/returns`);
    expect(r.status, r.text).toBe(200);
    return r.body.data;
}
async function returnBody(sale: {
    idSale: number;
}, quantity = 1, amount = 19, restock = true, fee = 0) {
    const data = await balance(sale);
    return { reason: "Devolucion F8", deliveryFeeRefund: fee, items: quantity ? [{ idSaleDetail: data.returnableItems[0].idSaleDetail, quantity, restock }] : [], refunds: amount ? [{ idSalePayment: data.refundablePayments[0].idSalePayment, amount }] : [], idCashSession: a.cash.idCashSession };
}
function postReturn(idSale: number, body: object, key = randomUUID(), cookies = a.business.auth.cookies) { return api("post", `/sales/${idSale}/returns`, cookies).set("Idempotency-Key", key).send(body); }
async function createConfirmed() { return directSale({ providerType: null }, true); }
async function preflight() {
    await assertTestConnection();
    if (!await querySingleRow<RowDataPacket>("SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active = 1 LIMIT 1"))
        throw new Error("Existing active plan required");
    for (const table of ["sale_returns", "sale_return_items", "sale_refunds"]) {
        if (!await querySingleRow<RowDataPacket>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?", [table]))
            throw new Error("Apply F8 SQL first");
    }
    if (!await querySingleRow<RowDataPacket>("SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=DATABASE() AND ROUTINE_NAME='sp_sale_return_apply_item'"))
        throw new Error("Apply F8 procedure first");
}
describe("F8 Returns / Refunds real DB gate (operator authorization required)", function suite() {
    beforeAll(async function setup() { await preflight(); a = await scenario("a"); b = await scenario("b"); courier = await createBusinessUserFixture({ idBusiness: a.business.business.idBusiness, role: "DELIVERY", usernamePrefix: `${runTag}_courier` }); });
    afterAll(async function cleanup() { await cleanupOwnFixtures(); });
    it("partial cash return + restock", async function partial() { const sale = await createConfirmed(), q = await quantity(); const result = await postReturn(sale.idSale, await returnBody(sale)); expect(result.status, result.text).toBe(201); expect(result.body.data.summary).toMatchObject({ returnStatus: "PARTIAL", refundedTotal: 19 }); expect(await quantity()).toBe(q + 1); expect(result.body.data.saleReturn.refunds[0].cashMovement).toMatchObject({ movementType: "EXPENSE", category: "SALE_REFUND" }); });
    it("no-restock preserves stock", async function noStock() { const sale = await createConfirmed(), q = await quantity(); expect((await postReturn(sale.idSale, await returnBody(sale, 1, 19, false))).status).toBe(201); expect(await quantity()).toBe(q); });
    it("second partial and final residual", async function second() { const sale = await createConfirmed(); expect((await postReturn(sale.idSale, await returnBody(sale))).status).toBe(201); expect((await postReturn(sale.idSale, await returnBody(sale))).status).toBe(201); expect((await balance(sale)).summary).toMatchObject({ returnStatus: "FULL", refundedTotal: 38, netSaleAmount: 4 }); });
    it("over-return rejected without economic effects", async function over() { const sale = await createConfirmed(), q = await quantity(); const r = await postReturn(sale.idSale, await returnBody(sale, 3, 42)); expect(r.body.code).toBe("SALE_RETURN_QUANTITY_EXCEEDED"); expect(await quantity()).toBe(q); expect((await balance(sale)).returns).toHaveLength(0); });
    it("full return + full refund", async function full() { const sale = await createConfirmed(); const r = await postReturn(sale.idSale, await returnBody(sale, 2, 42, true, 4)); expect(r.status, r.text).toBe(201); expect(r.body.data.summary).toMatchObject({ returnStatus: "FULL", refundStatus: "FULL", netSaleAmount: 0 }); });
    it("delivery fee only supports multiple allocations", async function fee() { const sale = await createConfirmed(); for (let i = 0; i < 2; i++)
        expect((await postReturn(sale.idSale, await returnBody(sale, 0, 2, false, 2))).status).toBe(201); expect((await balance(sale)).remainingDeliveryFeeRefund).toBe(0); });
    it("delivery fee overflow rejected", async function overFee() { const sale = await createConfirmed(); const r = await postReturn(sale.idSale, await returnBody(sale, 0, 5, false, 5)); expect(r.body.code).toBe("SALE_RETURN_DELIVERY_FEE_EXCEEDED"); });
    it("mixed confirmed payments and original allocations", async function mixed() {
        const method = await createPaymentMethodFixture(a.business.business.idBusiness);
        const sale = await createConfirmed(); // scoped fixture split, same original total and confirmed status
        await executeMutation("UPDATE sale_payments SET amount=20 WHERE idBusiness=? AND idSalePayment=?", [a.business.business.idBusiness, sale.payments[0].idSalePayment]);
        const add = await api("post", `/sales/${sale.idSale}/payments`).send({ idPaymentMethod: method.idPaymentMethod, amount: 22, status: "CONFIRMED", idCashSession: a.cash.idCashSession });
        expect(add.status, add.text).toBe(201);
        const data = await balance(sale), input = await returnBody(sale, 2, 20, true, 4);
        input.refunds = [{ idSalePayment: data.refundablePayments[0].idSalePayment, amount: 20 }, { idSalePayment: data.refundablePayments[1].idSalePayment, amount: 22 }];
        const r = await postReturn(sale.idSale, input);
        expect(r.status, r.text).toBe(201);
        expect(r.body.data.saleReturn.refunds.filter(function cash(f: {
            cashMovement: unknown;
        }) { return f.cashMovement; })).toHaveLength(1);
    });
    it("cash expense included in live expected cash", async function expense() { const sale = await createConfirmed(); const before = await api("get", `/cash-sessions/${a.cash.idCashSession}/summary`); expect(before.status).toBe(200); const r = await postReturn(sale.idSale, await returnBody(sale)); expect(r.status, r.text).toBe(201); const after = await api("get", `/cash-sessions/${a.cash.idCashSession}/summary`); expect(Number(after.body.data.expectedCash)).toBe(Number(before.body.data.expectedCash) - 19); });
    it("noncash creates no cash movement and null linkage", async function nonCash() { const method = await createPaymentMethodFixture(a.business.business.idBusiness); const sale = await directSale({ providerType: null }, true, method.idPaymentMethod); const input = await returnBody(sale); const r = await postReturn(sale.idSale, { ...input, idCashSession: null }); expect(r.status, r.text).toBe(201); expect(r.body.data.saleReturn.refunds[0]).toMatchObject({ idCashSession: null, cashMovement: null }); });
    it("settled cash payment history stays intact", async function settled() {
        const sale = await directSale({ providerType: "INTERNAL", assignedToUserId: courier.idUser });
        const id = sale.payments[0].idSalePayment;
        // Scoped settled-history fixture; F8 must not rewrite any of these original records.
        await executeMutation("INSERT INTO cash_settlements (idBusiness,collector_user_id,received_by_user_id,idCashSession,total_amount) VALUES (?,?,?,?,42)", [a.business.business.idBusiness, courier.idUser, a.business.owner.idUser, a.cash.idCashSession]);
        const settlement = await querySingleRow<RowDataPacket>("SELECT * FROM cash_settlements WHERE idBusiness=? ORDER BY idCashSettlement DESC LIMIT 1", [a.business.business.idBusiness]);
        await executeMutation("UPDATE sale_payments SET status='CONFIRMED',idCashSettlement=? WHERE idBusiness=? AND idSalePayment=?", [settlement!.idCashSettlement, a.business.business.idBusiness, id]);
        const payment = await querySingleRow<RowDataPacket>("SELECT * FROM sale_payments WHERE idBusiness=? AND idSalePayment=?", [a.business.business.idBusiness, id]);
        expect((await postReturn(sale.idSale, await returnBody(sale))).status).toBe(201);
        expect(await querySingleRow<RowDataPacket>("SELECT * FROM sale_payments WHERE idBusiness=? AND idSalePayment=?", [a.business.business.idBusiness, id])).toEqual(payment);
        expect(await querySingleRow<RowDataPacket>("SELECT * FROM cash_settlements WHERE idBusiness=? AND idCashSettlement=?", [a.business.business.idBusiness, settlement!.idCashSettlement])).toEqual(settlement);
    });
    it.each(["PENDING", "COLLECTED"])("%s unresolved blocked", async function unresolved(status) { const sale = await directSale({ providerType: null }); if (status === "COLLECTED")
        await executeMutation("UPDATE sale_payments SET status='COLLECTED',collected_by_user_id=? WHERE idBusiness=? AND idSalePayment=?", [courier.idUser, a.business.business.idBusiness, sale.payments[0].idSalePayment]); const r = await postReturn(sale.idSale, await returnBody(sale)); expect(r.body.code).toBe(status === "PENDING" ? "SALE_RETURN_PENDING_PAYMENT_MUST_BE_RESOLVED" : "SALE_RETURN_COLLECTED_PAYMENT_MUST_BE_SETTLED"); });
    it("OUT_FOR_DELIVERY blocked", async function transit() { const sale = await directSale(third, true); expect((await api("patch", `/deliveries/${sale.delivery.idSaleDelivery}/start`).send({})).status).toBe(200); const r = await postReturn(sale.idSale, await returnBody(sale)); expect(r.body.code).toBe("SALE_RETURN_DELIVERY_IN_TRANSIT"); });
    it("DELIVERED remains delivered after full return", async function delivered() { const sale = await directSale(third, true), id = sale.delivery.idSaleDelivery; expect((await api("patch", `/deliveries/${id}/start`).send({})).status).toBe(200); expect((await api("patch", `/deliveries/${id}/deliver`).send({})).status).toBe(200); expect((await postReturn(sale.idSale, await returnBody(sale, 2, 42, true, 4))).status).toBe(201); expect((await api("get", `/deliveries/${id}`)).body.data.status).toBe("DELIVERED"); });
    it.each(["PENDING", "ASSIGNED", "FAILED"])("full %s cancels delivery", async function fullDelivery(status) { const sale = await directSale(status === "PENDING" ? { providerType: null } : { providerType: "INTERNAL", assignedToUserId: courier.idUser }, true), id = sale.delivery.idSaleDelivery; if (status === "FAILED") {
        expect((await api("patch", `/deliveries/${id}/start`).send({})).status).toBe(200);
        expect((await api("patch", `/deliveries/${id}/fail`).send({ failureReason: "No recibe" })).status).toBe(200);
    } expect((await postReturn(sale.idSale, await returnBody(sale, 2, 38))).status).toBe(201); expect((await api("get", `/deliveries/${id}`)).body.data.status).toBe("CANCELLED"); });
    it("Sale and linked Order remain COMPLETED", async function order() { const id = await ready(true); const r = await convert(id, { ...conversion(true), payments: [{ idPaymentMethod: a.business.cashPaymentMethod.idPaymentMethod, amount: 42, status: "CONFIRMED" }] }); expect(r.status, r.text).toBe(201); const sale = r.body.data.sale; expect((await postReturn(sale.idSale, await returnBody(sale, 2, 42, true, 4))).status).toBe(201); expect((await api("get", `/orders/${id}`)).body.data.status).toBe("COMPLETED"); expect((await api("get", `/sales/${sale.idSale}`)).body.data.status).toBe("COMPLETED"); });
    it("cancel after Return blocked before stock reversal", async function cancel() { const sale = await createConfirmed(); expect((await postReturn(sale.idSale, await returnBody(sale))).status).toBe(201); const q = await quantity(); const r = await api("patch", `/sales/${sale.idSale}/cancel`).send({}); expect(r.body.code).toBe("SALE_WITH_RETURNS_CANNOT_BE_CANCELLED"); expect(await quantity()).toBe(q); });
    it("same UUID replay and changed payload conflict", async function replay() { const sale = await createConfirmed(), input = await returnBody(sale), key = randomUUID(); const first = await postReturn(sale.idSale, input, key), q = await quantity(); expect(first.status).toBe(201); const second = await postReturn(sale.idSale, input, key); expect(second.status).toBe(200); expect(second.body.data.saleReturn.idSaleReturn).toBe(first.body.data.saleReturn.idSaleReturn); expect(await quantity()).toBe(q); expect((await postReturn(sale.idSale, { ...input, reason: "Otra devolucion" }, key)).body.code).toBe("IDEMPOTENCY_KEY_CONFLICT"); });
    it("different-key concurrent full returns cannot duplicate effects", async function concurrent() { const sale = await createConfirmed(), input = await returnBody(sale, 2, 42, true, 4); const results = await Promise.all([postReturn(sale.idSale, input), postReturn(sale.idSale, input)]); expect(results.filter(function created(r) { return r.status === 201; })).toHaveLength(1); expect(results.filter(function conflict(r) { return r.status === 409; })).toHaveLength(1); expect((await balance(sale)).summary.refundedTotal).toBe(42); });
    it("tenant, SELLER, DELIVERY denied; ADMIN granted", async function permissions() { const sale = await createConfirmed(), input = await returnBody(sale); expect((await postReturn(sale.idSale, input, randomUUID(), b.business.auth.cookies)).status).toBe(404); for (const role of ["SELLER", "DELIVERY", "ADMIN"] as const) {
        const user = await createBusinessUserFixture({ idBusiness: a.business.business.idBusiness, role, usernamePrefix: `${runTag}_${role}` });
        const auth = await loginBusinessTestUser({ username: user.username, password: user.plainPasswordForTest });
        const read = await api("get", `/sales/${sale.idSale}/returns`, auth.cookies);
        expect(read.status).toBe(role === "ADMIN" ? 200 : 403);
        if (role !== "ADMIN")
            expect((await postReturn(sale.idSale, input, randomUUID(), auth.cookies)).status).toBe(403);
    } });
    it("cash close includes refund expense in expected cash", async function closeCash() { const sale = await createConfirmed(); expect((await postReturn(sale.idSale, await returnBody(sale))).status).toBe(201); const live = await api("get", `/cash-sessions/${a.cash.idCashSession}/summary`); expect(live.status).toBe(200); const result = await api("post", `/cash-sessions/${a.cash.idCashSession}/close`).send({ countedCashAmount: Number(live.body.data.expectedCash) }); expect(result.status, result.text).toBe(200); expect(result.body.data.session.expectedCashAmount).toBe(Number(live.body.data.expectedCash)); });
});
