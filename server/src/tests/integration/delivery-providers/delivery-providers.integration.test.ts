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

const runTag = `f7test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
type Scenario = Awaited<ReturnType<typeof scenario>>;
let a: Scenario, b: Scenario;
async function assertTestConnection() {
  validateTestDatabaseEnvironment();
  if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? "")) throw new Error("F7: test loopback exclusively");
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
  console.info(`F7 cleanup OK: ${runTag}, tenants=${ids.length}, users=${userIds.length}, FK checks preserved`);
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

describe("F7 delivery providers/cancellation real test (operator applies SQL first)", function suite() {
  beforeAll(async function setup() {
    await assertTestConnection();
    if (!await querySingleRow<RowDataPacket>("SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active = 1 LIMIT 1")) throw new Error("Existing active plan required");
    if (!await querySingleRow<RowDataPacket>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sale_deliveries' AND COLUMN_NAME = 'provider_type'")) throw new Error("Apply F7 SQL first");
    a = await scenario("a"); b = await scenario("b");
    courier = await createBusinessUserFixture({ idBusiness: a.business.business.idBusiness, role: "DELIVERY", usernamePrefix: `${runTag}_courier` });
    foreignCourier = await createBusinessUserFixture({ idBusiness: b.business.business.idBusiness, role: "DELIVERY", usernamePrefix: `${runTag}_foreign` });
  });
  afterAll(async function cleanup() { await cleanupOwnFixtures(); });

  it.each([null, "INTERNAL", "THIRD_PARTY"])("Direct Sale %s inicial, costo separado y evento", async function creation(type) {
    const provider = type === "THIRD_PARTY" ? third : type === "INTERNAL" ? { providerType: type, assignedToUserId: courier.idUser } : { providerType: null };
    const sale = await directSale(provider);
    expect(sale).toMatchObject({ deliveryFee: 4, total: 42, delivery: { providerType: type, status: type ? "ASSIGNED" : "PENDING", assignedToUserId: type === "INTERNAL" ? courier.idUser : null } });
    if (type === "THIRD_PARTY") expect(sale.delivery).toMatchObject({ externalProviderName: "Uber", externalCost: 12.5 });
    const events = await api("get", `/deliveries/${sale.delivery.idSaleDelivery}/events`); expect(events.status).toBe(200);
    expect(events.body.data[0].metadata.providerType).toBe(type);
  });
  it("Order READY -> Sale THIRD_PARTY mantiene datos del pedido y total", async function convertOrderCase() {
    const id = await ready(true); const result = await convert(id, { ...conversion(true), delivery: third as { providerType: "THIRD_PARTY"; externalProviderName: string; externalCost: number } });
    expect(result.status, result.text).toBe(201); expect(result.body.data.sale).toMatchObject({ idOrder: id, total: 42, deliveryFee: 4, delivery: { providerType: "THIRD_PARTY", externalProviderName: "Uber", assignedToUserId: null, recipientName: "Destinatario del pedido" } });
  });
  it("reasignar INTERNAL/THIRD_PARTY audita anterior y borra campos incompatibles", async function reassign() {
    const sale = await directSale({ providerType: "INTERNAL", assignedToUserId: courier.idUser }); const id = sale.delivery.idSaleDelivery;
    let result = await api("patch", `/deliveries/${id}/assign`).send(third); expect(result.status, result.text).toBe(200); expect(result.body.data.assignedToUserId).toBeNull();
    result = await api("patch", `/deliveries/${id}/assign`).send({ providerType: "INTERNAL", assignedToUserId: courier.idUser }); expect(result.status, result.text).toBe(200); expect(result.body.data.externalProviderName).toBeNull(); expect(result.body.data.externalCost).toBeNull();
    const events = await api("get", `/deliveries/${id}/events`); expect(events.body.data).toHaveLength(3); expect(events.body.data[2].metadata.previousAssignment.externalProviderName).toBe("Uber");
  });
  it("tercero + efectivo pendiente no inicia; no cambia estado ni eventos", async function pendingCash() {
    const sale = await directSale(third), id = sale.delivery.idSaleDelivery;
    const before = await effectCounts(); const result = await api("patch", `/deliveries/${id}/start`).send({}); expect(result.status).toBe(400); expect(result.body.code).toBe("THIRD_PARTY_PENDING_CASH_PAYMENT_NOT_ALLOWED");
    expect(await effectCounts()).toEqual(before); expect((await api("get", `/deliveries/${id}`)).body.data.status).toBe("ASSIGNED");
  });
  it("tercero pagado: ADMIN opera; cadete sin view_all no accede", async function permissions() {
    const sale = await directSale(third, true), id = sale.delivery.idSaleDelivery;
    const ownAuth = await loginBusinessTestUser({ username: courier.username, password: courier.plainPasswordForTest });
    expect((await api("get", `/deliveries/${id}`, ownAuth.cookies)).status).toBe(403);
    const user = await createBusinessUserFixture({ idBusiness: a.business.business.idBusiness, role: "ADMIN", usernamePrefix: `${runTag}_admin` });
    const auth = await loginBusinessTestUser({ username: user.username, password: user.plainPasswordForTest });
    expect((await api("patch", `/deliveries/${id}/start`, auth.cookies).send({})).status).toBe(200);
    expect((await api("patch", `/deliveries/${id}/deliver`, auth.cookies).send({})).status).toBe(200);
  });
  it.each(["PENDING", "ASSIGNED", "FAILED"])("anular %s unpaid restaura stock y cancela todo una vez", async function unpaid(status) {
    const initial = await quantity(); const sale = await directSale(status === "PENDING" ? { providerType: null } : { providerType: "INTERNAL", assignedToUserId: courier.idUser });
    const id = sale.delivery.idSaleDelivery;
    if (status === "FAILED") { expect((await api("patch", `/deliveries/${id}/start`).send({})).status).toBe(200); expect((await api("patch", `/deliveries/${id}/fail`).send({ failureReason: "No recibe" })).status).toBe(200); }
    const result = await api("patch", `/sales/${sale.idSale}/cancel`).send({}); expect(result.status, result.text).toBe(200); expect(await quantity()).toBe(initial);
    expect(result.body.data).toMatchObject({ status: "CANCELLED", delivery: { status: "CANCELLED" } }); expect(result.body.data.payments.every((p: { status: string }) => p.status === "CANCELLED")).toBe(true);
    expect((await api("patch", `/sales/${sale.idSale}/cancel`).send({})).status).toBe(409); expect(await quantity()).toBe(initial);
  });
  it.each(["ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"])("anulacion bloquea %s con codigo claro y sin efectos", async function blocked(status) {
    const sale = await directSale(third, true), id = sale.delivery.idSaleDelivery;
    if (status !== "ASSIGNED") expect((await api("patch", `/deliveries/${id}/start`).send({})).status).toBe(200);
    if (status === "DELIVERED") expect((await api("patch", `/deliveries/${id}/deliver`).send({})).status).toBe(200);
    const before = await effectCounts(), stock = await quantity(); const result = await api("patch", `/sales/${sale.idSale}/cancel`).send({});
    expect(result.status).toBe(409); expect(result.body.code).toBe(status === "ASSIGNED" ? "DELIVERY_SALE_REFUND_REQUIRED" : status === "DELIVERED" ? "DELIVERED_SALE_RETURN_REQUIRED" : "DELIVERY_IN_TRANSIT_CANNOT_BE_CANCELLED");
    expect(await effectCounts()).toEqual(before); expect(await quantity()).toBe(stock);
  });
  it("tercero admite pendientes no-cash sin rendicion externa", async function nonCash() {
    const method = await createPaymentMethodFixture(a.business.business.idBusiness);
    const sale = await directSale(third, false, method.idPaymentMethod), id = sale.delivery.idSaleDelivery;
    expect((await api("patch", `/deliveries/${id}/start`).send({})).status).toBe(200);
    expect((await api("patch", `/deliveries/${id}/deliver`).send({})).status).toBe(200);
  });
  it("tenant/rol INTERNAL invalidos y asignacion de entidad ajena rechazan", async function tenant() {
    const sale = await directSale({ providerType: null }), id = sale.delivery.idSaleDelivery;
    for (const assignedToUserId of [foreignCourier.idUser, a.business.owner.idUser]) expect((await api("patch", `/deliveries/${id}/assign`).send({ providerType: "INTERNAL", assignedToUserId })).status).toBe(400);
    const foreign = await api("patch", `/deliveries/${id}/assign`, b.business.auth.cookies).send(third); expect(foreign.status).toBe(400);
    expect((await api("get", `/deliveries/${id}`)).body.data.providerType).toBeNull();
  });
});
