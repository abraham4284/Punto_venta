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

const runTag = `f5test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
type Scenario = Awaited<ReturnType<typeof scenario>>;
let a: Scenario, b: Scenario;
async function assertTestConnection() {
  validateTestDatabaseEnvironment();
  if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? "")) throw new Error("F5: test loopback exclusively");
  const identity = await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db");
  if (identity?.db !== "punto_venta_integration_test") throw new Error("F5: unexpected selected database");
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
    const step = await api("patch", `/orders/${id}/status`).send({ status }); expect(step.status, step.text).toBe(200);
  }
  return id;
}
function conversion(delivery = false): OrderConversionBody { return { idCashSession: a.cash.idCashSession, payments: [{ idPaymentMethod: a.business.cashPaymentMethod.idPaymentMethod, amount: delivery ? 42 : 38, status: delivery ? "PENDING" : "CONFIRMED" }] }; }
function convert(id: number, body: OrderConversionBody = conversion(), key = randomUUID(), cookies = a.business.auth.cookies) { return api("post", `/orders/${id}/convert-to-sale`, cookies).set("Idempotency-Key", key).send(body); }
async function quantity() { const stock = await querySingleRow<RowDataPacket>("SELECT quantity FROM stock WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?", [a.business.business.idBusiness, a.product.idProduct, a.business.defaultDeposit.idDeposit]); return Number(stock?.quantity); }
async function effectCounts() {
  const counts: Record<string, number> = {};
  for (const table of ["sales", "sale_details", "sale_payments", "sale_payment_events", "sale_deliveries", "delivery_events", "stock_movements", "cash_movements", "order_events"]) counts[table] = await countRows(table, "idBusiness = ?", [a.business.business.idBusiness]);
  return counts;
}
async function assertNoConversion(id: number, before: Record<string, number>, stock: number) {
  expect(await effectCounts()).toEqual(before); expect(await quantity()).toBe(stock);
  const detail = await api("get", `/orders/${id}`); expect(detail.body.data).toMatchObject({ status: "READY", linkedSale: null });
}

describe("F5 HTTP/DB after operator migration (not DB-free)", function suite() {
  beforeAll(async function setup() {
    await assertTestConnection();
    if (!await querySingleRow<RowDataPacket>("SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active = 1 LIMIT 1")) throw new Error("Existing active plan required; suite does not seed global catalogs");
    if (!await querySingleRow<RowDataPacket>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'idOrder'")) throw new Error("Apply F5 migration/procedures first");
    a = await scenario("a"); b = await scenario("b");
  });
  afterAll(async function cleanup() { await cleanupOwnFixtures(); });

  it("READY PICKUP: venta, detalles, pago/evento, movimiento y descuento una vez", async function pickup() {
    const id = await ready(), before = await quantity(); const result = await convert(id);
    expect(result.status, result.text).toBe(201); const { order, sale } = result.body.data;
    expect(order).toMatchObject({ status: "COMPLETED", linkedSale: { idSale: sale.idSale } });
    expect(sale).toMatchObject({ idOrder: id, deliveryFee: 0, total: 38, delivery: null });
    expect(sale.payments).toHaveLength(1); expect(sale.items).toHaveLength(1); expect(await quantity()).toBe(before - 2);
    expect(await countRows("stock_movements", "idBusiness = ? AND reference_type = 'SALE' AND reference_id = ?", [a.business.business.idBusiness, sale.idSale])).toBe(1);
    expect(await countRows("sale_payment_events", "idBusiness = ? AND idSalePayment = ? AND event_type = 'PAYMENT_CREATED'", [a.business.business.idBusiness, sale.payments[0].idSalePayment])).toBe(1);
    expect(await countRows("order_events", "idBusiness = ? AND idOrder = ? AND from_status = 'READY' AND to_status = 'COMPLETED'", [a.business.business.idBusiness, id])).toBe(1);
  });
  it("DELIVERY usa destinatario Order, fee y pago pendiente explicito", async function delivery() {
    const id = await ready(true); const result = await convert(id, conversion(true));
    expect(result.status, result.text).toBe(201);
    expect(result.body.data.sale).toMatchObject({ deliveryFee: 4, total: 42, delivery: { recipientName: "Destinatario del pedido", recipientPhone: "001122", deliveryAddress: "Calle de Order 123", deliveryReference: "Porton verde" } });
    const payment = result.body.data.sale.payments[0]; expect(payment.status).toBe("PENDING"); expect(payment.idCashSession).toBeNull();
    expect(await countRows("delivery_events", "idBusiness = ? AND idSaleDelivery = ? AND event_type = 'DELIVERY_CREATED'", [a.business.business.idBusiness, result.body.data.sale.delivery.idSaleDelivery])).toBe(1);
  });
  it("ON_ORDER stock cero rechaza y revierte todos los efectos", async function stock() {
    const id = await ready(false, a.zero.idProduct), before = await effectCounts(), stock = await quantity();
    const result = await convert(id); expect(result.status, result.text).toBe(409); await assertNoConversion(id, before, stock);
  });
  it("caja de otro tenant y metodo ajeno revierten todo", async function cash() {
    const id = await ready(), before = await effectCounts(), stock = await quantity();
    const result = await convert(id, { ...conversion(), idCashSession: b.cash.idCashSession }); expect(result.status, result.text).toBe(409); await assertNoConversion(id, before, stock);
    const method = await convert(id, { ...conversion(), payments: [{ ...conversion().payments[0], idPaymentMethod: b.business.cashPaymentMethod.idPaymentMethod }] }); expect(method.status, method.text).toBe(400); await assertNoConversion(id, before, stock);
  });
  it("tenant ajeno 404; SELLER denegado y ADMIN permitido", async function permissions() {
    const id = await ready(); expect((await convert(id, conversion(), randomUUID(), b.business.auth.cookies)).status).toBe(404);
    for (const role of ["SELLER", "ADMIN"] as const) {
      const user = await createBusinessUserFixture({ idBusiness: a.business.business.idBusiness, role, usernamePrefix: `${runTag}_${role}` });
      const auth = await loginBusinessTestUser({ username: user.username, password: user.plainPasswordForTest });
      const result = await convert(id, conversion(), randomUUID(), auth.cookies); expect(result.status, result.text).toBe(role === "ADMIN" ? 201 : 403);
    }
  });
  it("caja cerrada e inactiva rechazan sin efectos parciales", async function cashState() {
    const id = await ready(), before = await effectCounts(), stock = await quantity();
    const closed = await createCashSessionFixture({ idBusiness: a.business.business.idBusiness, idCashRegister: a.business.defaultCashRegister.idCashRegister, idUser: a.business.owner.idUser });
    await executeMutation("UPDATE cash_sessions SET status = 'CLOSED', closed_at = NOW(), closed_by_user_id = ?, expected_cash_amount = 0, counted_cash_amount = 0, difference_amount = 0 WHERE idBusiness = ? AND idCashSession = ?", [a.business.owner.idUser, a.business.business.idBusiness, closed.idCashSession]);
    const result = await convert(id, { ...conversion(), idCashSession: closed.idCashSession }); expect(result.status, result.text).toBe(409); await assertNoConversion(id, before, stock);
    await executeMutation("UPDATE cash_registers SET is_active = 0 WHERE idBusiness = ? AND idCashRegister = ?", [a.business.business.idBusiness, a.business.defaultCashRegister.idCashRegister]);
    try { const inactive = await convert(id); expect(inactive.status, inactive.text).toBe(409); await assertNoConversion(id, before, stock); }
    finally { await executeMutation("UPDATE cash_registers SET is_active = 1 WHERE idBusiness = ? AND idCashRegister = ?", [a.business.business.idBusiness, a.business.defaultCashRegister.idCashRegister]); }
  });
  it("fallo de delivery despues de stock/pagos revierte toda la conversion", async function deliveryRollback() {
    const id = await ready(true), before = await effectCounts(), stock = await quantity();
    const result = await convert(id, { ...conversion(true), delivery: { assignedToUserId: b.business.owner.idUser } });
    expect(result.status, result.text).toBe(400); await assertNoConversion(id, before, stock);
  });
  it.each([false, true])("concurrencia keys distintas=%s: una venta/un descuento; replay no escribe", async function concurrency(distinctKeys) {
    const id = await ready(), stock = await quantity(), key = randomUUID();
    const results = await Promise.all([convert(id, conversion(), key), convert(id, conversion(), distinctKeys ? randomUUID() : key)]);
    expect(results.map(function status(r) { return r.status; }).sort()).toEqual([200, 201]);
    expect(new Set(results.map(function id(r) { return r.body.data.sale.idSale; })).size).toBe(1);
    expect(await countRows("sales", "idBusiness = ? AND idOrder = ?", [a.business.business.idBusiness, id])).toBe(1); expect(await quantity()).toBe(stock - 2);
    const before = await effectCounts(); const retry = await convert(id, conversion(), randomUUID()); expect(retry.status).toBe(200); expect(retry.body.idempotentReplay).toBe(true); expect(await effectCounts()).toEqual(before);
  });
  it("key de POS y de otro Order causan conflicto, nunca replay", async function collision() {
    const existing = await ready(), key = randomUUID(); const sale = await convert(existing, conversion(), key); expect(sale.status).toBe(201);
    const id = await ready(), before = await effectCounts(), stock = await quantity();
    const result = await convert(id, conversion(), key); expect(result.status).toBe(409); expect(result.body.code).toBe("IDEMPOTENCY_KEY_CONFLICT"); await assertNoConversion(id, before, stock);
    const posKey = randomUUID(); const pos = await api("post", "/sales").set("Idempotency-Key", posKey).send({ idCustomer: a.customer.idCustomer, idDeposit: a.business.defaultDeposit.idDeposit, ...conversion(), subtotal: 40, discountTotal: 2, total: 38, items: [{ idProduct: a.product.idProduct, quantity: 2, unitPrice: 20, discount: 2, total: 38 }] });
    expect(pos.status, pos.text).toBe(201); expect(pos.body.data.idOrder).toBeNull(); expect(pos.body.data.deliveryFee).toBe(0);
    const conflict = await convert(id, conversion(), posKey); expect(conflict.status).toBe(409); expect(conflict.body.code).toBe("IDEMPOTENCY_KEY_CONFLICT");
  });
  it("cancelar Sale conserva COMPLETED e impide reconversion", async function cancel() {
    const id = await ready(), result = await convert(id); expect(result.status).toBe(201); const saleId = result.body.data.sale.idSale;
    const cancelled = await api("patch", `/sales/${saleId}/cancel`).send({}); expect(cancelled.status, cancelled.text).toBe(200);
    const before = await effectCounts(), stock = await quantity(); const replay = await convert(id);
    expect(replay.status).toBe(200); expect(replay.body.data.order).toMatchObject({ status: "COMPLETED", linkedSale: { idSale: saleId, status: "CANCELLED" } }); expect(replay.body.data.sale.idSale).toBe(saleId);
    expect(await effectCounts()).toEqual(before); expect(await quantity()).toBe(stock);
  });
});

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
      for (const table of ["order_events", "order_details", "delivery_events", "sale_payment_events", "sale_deliveries", "sale_payments", "cash_settlements", "sale_details", "sales", "orders", "purchase_details", "purchases", "stock_movements", "cash_movements", "cash_session_payment_summaries", "cash_sessions", "stock", "product_images", "products", "product_categories", "customers", "suppliers", "deposits", "cash_registers", "payment_methods", "notifications", "legal_acceptances", "business_user_permissions", "business_subscriptions", "platform_audit_logs", "user_sessions", "business_users"]) {
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
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  expect(await countRows("businesses", "LEFT(slug, ?) = ?", [prefix.length, prefix])).toBe(0);
  expect(await countRows("users", "LEFT(username, ?) = ?", [runTag.length, runTag])).toBe(0);
  console.info(`F5 cleanup OK: ${runTag}, tenants=${ids.length}, users=${userIds.length}, FK checks preserved`);
}
