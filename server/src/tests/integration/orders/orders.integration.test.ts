import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { executeMutation, querySingleRow, validateTestDatabaseEnvironment } from "@/tests/helpers/test-database.helper.js";
import { countRows } from "@/tests/helpers/economic-db-test.helper.js";
import { loginBusinessTestUser } from "@/tests/helpers/business-auth-test.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import type { OperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createBusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import type { BusinessUserFixture } from "@/tests/fixtures/business-user.fixture.js";
import { createCustomerFixture } from "@/tests/fixtures/customer.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import { createDepositFixture } from "@/tests/fixtures/deposit.fixture.js";
import { createPaymentMethodFixture } from "@/tests/fixtures/payment-method.fixture.js";
import type { OrderBody } from "@/modules/businesses-app/orders/types/index.js";

const runTag = `ordtest_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const effects = ["stock_movements", "sales", "sale_details", "sale_payments", "sale_deliveries", "cash_movements"] as const;
type Scenario = Awaited<ReturnType<typeof scenario>>;
let a: Scenario;
let b: Scenario;
let effectBaseline: Record<string, number>;
let stockBaseline: RowDataPacket[];

async function assertTestConnection(): Promise<void> {
  validateTestDatabaseEnvironment();
  if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? "")) {
    throw new Error("Orders: ejecucion permitida solo en DB test loopback");
  }
  const id = await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db, @@hostname AS serverHost, VERSION() AS version");
  if (id?.db !== "punto_venta_integration_test") throw new Error("Orders: DB seleccionada no autorizada");
}

async function scenario(label: string) {
  const business = await createOperationalBusinessFixture(`${runTag}_${label}`);
  const idBusiness = business.business.idBusiness;
  const customer = await createCustomerFixture(idBusiness);
  const category = await createProductCategoryFixture(idBusiness);
  const product = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 10 });
  const zero = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 0 });
  const onOrder = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 0 });
  await executeMutation("UPDATE products SET sale_mode = 'ON_ORDER' WHERE idBusiness = ? AND idProduct = ?", [idBusiness, onOrder.idProduct]);
  const deposit = await createDepositFixture(idBusiness);
  const method = await createPaymentMethodFixture(idBusiness);
  return { business, customer, product, zero, onOrder, deposit, method };
}

function payload(s: Scenario = a): OrderBody {
  return { idCustomer: s.customer.idCustomer, idDeposit: s.business.defaultDeposit.idDeposit,
    expectedPaymentMethodId: null, fulfillmentType: "PICKUP", deliveryFee: 0, subtotal: 40, discountTotal: 2, total: 38,
    items: [{ idProduct: s.product.idProduct, quantity: 2, unitPrice: 20, discount: 2, total: 38 }] };
}
function api(method: "get" | "post" | "put" | "patch", path: string, cookies: string[] = a.business.auth.cookies) {
  return request(getTestApp())[method](`/api/orders${path}`).set("Cookie", cookies).set("X-CSRF-Protection", "1");
}
async function create(input = payload(), cookies = a.business.auth.cookies, key = randomUUID()) {
  const result = await api("post", "", cookies).set("Idempotency-Key", key).send(input);
  expect(result.status, result.text).toBe(201);
  return result;
}
async function events(id: number, cookies = a.business.auth.cookies) {
  const result = await api("get", `/${id}/events`, cookies);
  expect(result.status, result.text).toBe(200);
  return result.body.data as { idOrderEvent: number; eventType: string; idUser: number; fromStatus: string | null; toStatus: string; reason: string | null; createdAt: string }[];
}
async function effectCounts() {
  const counts: Record<string, number> = {};
  for (const table of effects) counts[table] = await countRows(table, "1 = 1", []);
  return counts;
}
async function stocks() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM stock WHERE idBusiness IN (?, ?) ORDER BY idStock", [a.business.business.idBusiness, b.business.business.idBusiness]);
  return rows;
}
async function role(role: "ADMIN" | "SELLER" | "DELIVERY"): Promise<{ fixture: BusinessUserFixture; cookies: string[] }> {
  const fixture = await createBusinessUserFixture({ idBusiness: a.business.business.idBusiness, role, usernamePrefix: `${runTag}_${role.toLowerCase()}` });
  const auth = await loginBusinessTestUser({ username: fixture.username, password: fixture.plainPasswordForTest });
  return { fixture, cookies: auth.cookies };
}

// Never use resetIntegrationTestData: it deletes all data in the test database.
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
      for (const table of ["order_events", "order_details", "orders", "delivery_events", "sale_payment_events", "sale_deliveries", "sale_payments", "cash_settlements", "sale_details", "sales", "purchase_details", "purchases", "stock_movements", "cash_movements", "cash_session_payment_summaries", "cash_sessions", "stock", "product_images", "products", "product_categories", "customers", "suppliers", "deposits", "cash_registers", "payment_methods", "notifications", "legal_acceptances", "business_user_permissions", "business_subscriptions", "platform_audit_logs", "user_sessions", "business_users"]) {
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
  console.info(`Orders cleanup OK: ${runTag}, tenants=${ids.length}, users=${userIds.length}, FK checks preserved`);
}

describe("Orders real HTTP/DB integration (scoped fixtures)", function suite() {
  beforeAll(async function setup() {
    await assertTestConnection();
    const identity = await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db, @@hostname AS serverHost, VERSION() AS version");
    console.info("Orders authorized test target:", identity, "fixture tag:", runTag);
    const plan = await querySingleRow<RowDataPacket>("SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active = 1 LIMIT 1");
    if (!plan) throw new Error("Se requiere plan existente: no se crea un catalogo SaaS global para esta suite");
    a = await scenario("a"); b = await scenario("b");
    effectBaseline = await effectCounts(); stockBaseline = await stocks();
  });
  afterAll(async function cleanup() { await cleanupOwnFixtures(); });

  it("create PICKUP, snapshots, detail, eventos y replay secuencial sin duplicados", async function pickup() {
    const key = randomUUID(); const initial = await create(payload(), a.business.auth.cookies, key);
    const order = initial.body.data; const id = Number(order.idOrder);
    expect(order).toMatchObject({ status: "PENDING", fulfillmentType: "PICKUP", delivery: null, deliveryFee: 0,
      customerSnapshot: { fullName: a.customer.fullName, phone: "111" }, subtotal: 40, discountTotal: 2, total: 38 });
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ idProduct: a.product.idProduct, productName: a.product.name, barcode: a.product.barcode, unitType: "UNIT", saleMode: "stock", quantity: 2, unitPrice: 20, total: 38 });
    const detail = await api("get", `/${id}`); expect(detail.status, detail.text).toBe(200); expect(detail.body.data).toEqual(order);
    const history = await events(id); expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ eventType: "CREATED", idUser: a.business.owner.idUser, fromStatus: null, toStatus: "PENDING" });
    const replay = await api("post", "").set("Idempotency-Key", key).send(payload());
    expect(replay.status, replay.text).toBe(200); expect(replay.body.idempotentReplay).toBe(true); expect(replay.body.data.idOrder).toBe(id);
    expect(await countRows("orders", "idBusiness = ? AND idempotency_key = ?", [a.business.business.idBusiness, key])).toBe(1);
    expect(await countRows("order_details", "idBusiness = ? AND idOrder = ?", [a.business.business.idBusiness, id])).toBe(1);
    expect(await events(id)).toHaveLength(1);
  });

  it("PUT PENDING/CONFIRMED, snapshots refrescados, state machine, rechazo atomico PREPARING/COMPLETED", async function lifecycle() {
    const id = Number((await create()).body.data.idOrder);
    const alt = await createCustomerFixture(a.business.business.idBusiness, "Actualizado");
    await executeMutation("UPDATE products SET name = ? WHERE idBusiness = ? AND idProduct = ?", ["Nombre snapshot actualizado", a.business.business.idBusiness, a.zero.idProduct]);
    const changed: OrderBody = { ...payload(), idCustomer: alt.idCustomer, idDeposit: a.deposit.idDeposit,
      expectedPaymentMethodId: a.method.idPaymentMethod, observation: "Edicion completa", subtotal: 30, discountTotal: 0, total: 30,
      items: [{ idProduct: a.zero.idProduct, quantity: 3, unitPrice: 10, discount: 0, total: 30 }] };
    const pending = await api("put", `/${id}`).send(changed); expect(pending.status, pending.text).toBe(200);
    expect(pending.body.data).toMatchObject({ status: "PENDING", observation: "Edicion completa", expectedPaymentMethodId: a.method.idPaymentMethod, idDeposit: a.deposit.idDeposit, customerSnapshot: { fullName: alt.fullName } });
    expect(pending.body.data.items).toHaveLength(1); expect(pending.body.data.items[0]).toMatchObject({ idProduct: a.zero.idProduct, productName: "Nombre snapshot actualizado" });
    expect(await countRows("order_details", "idOrder = ? AND idProduct = ?", [id, a.product.idProduct])).toBe(0);
    expect((await api("patch", `/${id}/status`).send({ status: "CONFIRMED" })).status).toBe(200);
    const confirmed = await api("put", `/${id}`).send({ ...changed, observation: "Edicion confirmada" });
    expect(confirmed.status, confirmed.text).toBe(200); expect(confirmed.body.data.status).toBe("CONFIRMED");
    expect((await api("patch", `/${id}/status`).send({ status: "PREPARING" })).status).toBe(200);
    const before = await api("get", `/${id}`); const eventBefore = await events(id);
    const rejected = await api("put", `/${id}`).send(changed);
    expect(rejected.status).toBe(409); expect(rejected.body.code).toBe("ORDER_NOT_EDITABLE");
    expect((await api("get", `/${id}`)).body.data).toEqual(before.body.data); expect(await events(id)).toEqual(eventBefore);
    expect((await api("patch", `/${id}/status`).send({ status: "READY" })).status).toBe(200);
    const ready = (await api("get", `/${id}`)).body.data;
    const completed = await api("patch", `/${id}/status`).send({ status: "COMPLETED" }); expect(completed.status).toBe(400);
    expect((await api("get", `/${id}`)).body.data).toEqual(ready);
    const history = await events(id);
    expect(history.map(function type(e) { return e.eventType; })).toEqual(["CREATED", "UPDATED", "STATUS_CHANGED", "UPDATED", "STATUS_CHANGED", "STATUS_CHANGED"]);
    expect(history.every(function actor(e) { return e.idUser === a.business.owner.idUser; })).toBe(true);
    expect(history.map(function id(e) { return e.idOrderEvent; })).toEqual([...history].sort(function sort(x, y) { return x.idOrderEvent - y.idOrderEvent; }).map(function id(e) { return e.idOrderEvent; }));
    expect(history.map(function date(e) { return Date.parse(e.createdAt); })).toEqual([...history].map(function date(e) { return Date.parse(e.createdAt); }).sort(function sort(x, y) { return x - y; }));
  });

  it("DELIVERY y cancelacion persistida; recancel y PICKUP invalido no mutan", async function cancellation() {
    const delivery = { recipientName: "Destinatario", recipientPhone: "001122", address: "Calle 123", reference: "Timbre" };
    const created = await create({ ...payload(), fulfillmentType: "DELIVERY", delivery, deliveryFee: 7.5, total: 45.5 });
    const id = Number(created.body.data.idOrder); expect(created.body.data).toMatchObject({ delivery, total: 45.5, deliveryFee: 7.5 });
    const cancelled = await api("patch", `/${id}/cancel`).send({ reason: "Cliente cancela" }); expect(cancelled.status, cancelled.text).toBe(200);
    expect(cancelled.body.data).toMatchObject({ status: "CANCELLED", cancellationReason: "Cliente cancela" });
    const db = await querySingleRow<RowDataPacket>("SELECT status,cancellation_reason,delivery_address,total FROM orders WHERE idBusiness = ? AND idOrder = ?", [a.business.business.idBusiness, id]);
    expect(db).toMatchObject({ status: "CANCELLED", cancellation_reason: "Cliente cancela", delivery_address: "Calle 123" }); expect(Number(db!.total)).toBe(45.5);
    expect((await events(id))[1]).toMatchObject({ eventType: "CANCELLED", reason: "Cliente cancela" });
    expect((await api("patch", `/${id}/cancel`).send({ reason: "Otra cancelacion" })).status).toBe(409); expect(await events(id)).toHaveLength(2);
    const before = await countRows("orders", "idBusiness = ?", [a.business.business.idBusiness]);
    const invalid = await api("post", "").set("Idempotency-Key", randomUUID()).send({ ...payload(), delivery, deliveryFee: 1, total: 39 });
    expect(invalid.status).toBe(400); expect(await countRows("orders", "idBusiness = ?", [a.business.business.idBusiness])).toBe(before);
  });

  it("list/filter/paginacion SQL y metricas del conjunto completo, nunca de otro tenant", async function list() {
    const before = await countRows("orders", "idBusiness = ? AND status = 'PENDING'", [a.business.business.idBusiness]);
    const created = await create();
    const result = await api("get", "?status=PENDING&page=1&limit=1"); expect(result.status, result.text).toBe(200);
    expect(result.body.data.orders).toHaveLength(1); expect(result.body.data.orders[0].idOrder).toBe(created.body.data.idOrder);
    expect(result.body.data.pagination).toMatchObject({ totalRecords: before + 1, currentPage: 1, totalPages: before + 1, limit: 1 });
    expect(result.body.data.metrics).toMatchObject({ total: before + 1, pending: before + 1 });
    const summary = await querySingleRow<RowDataPacket>("SELECT SUM(total) AS totalAmount FROM orders WHERE idBusiness = ? AND status = 'PENDING'", [a.business.business.idBusiness]);
    expect(result.body.data.metrics.totalAmount).toBe(Number(summary!.totalAmount));
    const filtered = await api("get", `?search=${encodeURIComponent(created.body.data.orderNumber)}&idCustomer=${a.customer.idCustomer}&fulfillmentType=PICKUP`);
    expect(filtered.status, filtered.text).toBe(200); expect(filtered.body.data.pagination.totalRecords).toBe(1);
    expect(filtered.body.data.orders[0].idBusiness).toBe(a.business.business.idBusiness);
  });

  it("products-by-deposit incluye STOCK positivo/cero, ON_ORDER cero y ausencia de fila stock", async function products() {
    const result = await api("get", `/products-by-deposit/${a.business.defaultDeposit.idDeposit}?limit=100`); expect(result.status, result.text).toBe(200);
    expect(result.body.data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ idProduct: a.product.idProduct, saleMode: "stock", stockQuantity: 10 }),
      expect.objectContaining({ idProduct: a.zero.idProduct, saleMode: "stock", stockQuantity: 0 }),
      expect.objectContaining({ idProduct: a.onOrder.idProduct, saleMode: "on_order", stockQuantity: 0 }),
    ]));
    const noStockRow = await api("get", `/products-by-deposit/${a.deposit.idDeposit}?limit=100`); expect(noStockRow.status, noStockRow.text).toBe(200);
    expect(noStockRow.body.data.items.every(function zero(item: { stockQuantity: number }) { return item.stockQuantity === 0; })).toBe(true);
    const order = await create({ ...payload(), items: [{ ...payload().items[0], idProduct: a.onOrder.idProduct }] });
    expect(order.body.data.items[0].saleMode).toBe("on_order");
  });

  it("aisla todas las lecturas/mutaciones y referencias entre A y B", async function isolation() {
    const foreign = await create(payload(b), b.business.auth.cookies); const id = Number(foreign.body.data.idOrder);
    const history = await events(id, b.business.auth.cookies);
    for (const [method, suffix, input] of [
      ["get", `/${id}`, undefined], ["get", `/${id}/events`, undefined], ["put", `/${id}`, payload()],
      ["patch", `/${id}/status`, { status: "CONFIRMED" }], ["patch", `/${id}/cancel`, { reason: "No autorizado" }],
    ] as const) {
      const test = api(method, suffix); const result = input ? await test.send(input) : await test;
      expect(result.status, result.text).toBe(404); expect(result.body.data).toBeUndefined();
    }
    for (const change of [{ idCustomer: b.customer.idCustomer }, { idDeposit: b.deposit.idDeposit },
      { expectedPaymentMethodId: b.method.idPaymentMethod }, { items: [{ ...payload().items[0], idProduct: b.product.idProduct }] }]) {
      const result = await api("post", "").set("Idempotency-Key", randomUUID()).send({ ...payload(), ...change }); expect(result.status, result.text).toBe(400);
    }
    expect((await api("get", `/products-by-deposit/${b.deposit.idDeposit}`)).status).toBe(400);
    expect((await api("get", `?search=${encodeURIComponent(foreign.body.data.orderNumber)}`)).body.data.orders).toHaveLength(0);
    expect((await api("get", `/${id}`, b.business.auth.cookies)).body.data).toEqual(foreign.body.data);
    expect(await events(id, b.business.auth.cookies)).toEqual(history);
  });

  it("respeta grants reales ADMIN, SELLER y DELIVERY sin modificarlos", async function permissions() {
    const admin = await role("ADMIN"), seller = await role("SELLER"), courier = await role("DELIVERY");
    const created = await create(payload(), seller.cookies); const id = Number(created.body.data.idOrder);
    expect((await api("get", `/${id}`, seller.cookies)).status).toBe(200);
    expect((await api("put", `/${id}`, seller.cookies).send(payload())).status).toBe(200);
    expect((await api("patch", `/${id}/status`, seller.cookies).send({ status: "CONFIRMED" })).status).toBe(403);
    expect((await api("patch", `/${id}/cancel`, seller.cookies).send({ reason: "No permitido" })).status).toBe(403);
    expect((await api("patch", `/${id}/status`, admin.cookies).send({ status: "CONFIRMED" })).status).toBe(200);
    expect((await api("patch", `/${id}/cancel`, admin.cookies).send({ reason: "Cancelacion admin" })).status).toBe(200);
    expect((await api("get", "", courier.cookies)).status).toBe(403);
    expect((await api("post", "", courier.cookies).set("Idempotency-Key", randomUUID()).send(payload())).status).toBe(403);
  });

  it.each(["user", "membership"])("bloquea actor %s inactivo aun con cookie previa", async function inactive(kind) {
    const admin = await role("ADMIN"); const ownId = a.business.business.idBusiness;
    if (kind === "user") await executeMutation("UPDATE users SET is_active = 0 WHERE idUser = ?", [admin.fixture.idUser]);
    else await executeMutation("UPDATE business_users SET is_active = 0 WHERE idBusiness = ? AND idUser = ?", [ownId, admin.fixture.idUser]);
    const before = await countRows("orders", "idBusiness = ?", [ownId]);
    const result = await api("post", "", admin.cookies).set("Idempotency-Key", randomUUID()).send(payload());
    expect([401, 403]).toContain(result.status); expect(await countRows("orders", "idBusiness = ?", [ownId])).toBe(before);
  });

  it("dos creates concurrentes con igual key convergen sin duplicar detalles/evento", async function concurrency() {
    const key = randomUUID();
    const send = function send() { return api("post", "").set("Idempotency-Key", key).send(payload()); };
    const [first, second] = await Promise.all([send(), send()]);
    expect([first.status, second.status].sort(), `${first.text}\n${second.text}`).toEqual([200, 201]);
    expect(first.body.data.idOrder).toBe(second.body.data.idOrder);
    expect([first.body.idempotentReplay, second.body.idempotentReplay].sort()).toEqual([false, true]);
    const id = Number(first.body.data.idOrder);
    expect(await countRows("orders", "idBusiness = ? AND idempotency_key = ?", [a.business.business.idBusiness, key])).toBe(1);
    expect(await countRows("order_details", "idBusiness = ? AND idOrder = ?", [a.business.business.idBusiness, id])).toBe(1);
    expect(await events(id)).toHaveLength(1);
  });

  it("stock antes/despues identico y cero efectos economicos en toda la DB test", async function noEffects() {
    expect(await stocks()).toEqual(stockBaseline);
    expect(await effectCounts()).toEqual(effectBaseline);
    console.info("Orders invariants verified: stock rows unchanged; global economic counts unchanged", effectBaseline);
  });
});
