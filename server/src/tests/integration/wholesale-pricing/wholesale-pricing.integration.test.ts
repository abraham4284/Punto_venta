import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { executeMutation, querySingleRow, validateTestDatabaseEnvironment } from "@/tests/helpers/test-database.helper.js";
import { countRows } from "@/tests/helpers/economic-db-test.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createCustomerFixture } from "@/tests/fixtures/customer.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import { createCashSessionFixture } from "@/tests/fixtures/cash-session.fixture.js";
import { createCashRegisterFixture } from "@/tests/fixtures/cash-register.fixture.js";
import type { SaleWithDetailsResponse } from "@/modules/businesses-app/sales/types/index.js";

const runTag = `f10test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
type Scenario = Awaited<ReturnType<typeof scenario>>;
let a: Scenario, b: Scenario;
async function assertTestConnection() {
  validateTestDatabaseEnvironment();
  if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? "")) throw new Error("F10.1 test loopback exclusively");
  if ((await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db"))?.db !== "punto_venta_integration_test") throw new Error("F10.1 unexpected database");
}
async function scenario(label: string) {
  const business = await createOperationalBusinessFixture(`${runTag}_${label}`);
  const idBusiness = business.business.idBusiness;
  const customer = await createCustomerFixture(idBusiness);
  const category = await createProductCategoryFixture(idBusiness);
  const product = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 1000 });
  const noWholesale = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 1000 });
  const below = await createProductFixture({ idBusiness, idProductCategory: category.idProductCategory, idDeposit: business.defaultDeposit.idDeposit, quantity: 1000 });
  await executeMutation("UPDATE products SET price_sale=15000, price_wholesale=10000 WHERE idBusiness=? AND idProduct=?", [idBusiness, product.idProduct]);
  await executeMutation("UPDATE products SET price_sale=75000, price_wholesale=49999 WHERE idBusiness=? AND idProduct=?", [idBusiness, below.idProduct]);
  const cash = await createCashSessionFixture({ idBusiness, idCashRegister: business.defaultCashRegister.idCashRegister, idUser: business.owner.idUser });
  return { business, customer, product, noWholesale, below, cash };
}
function api(method: "post" | "get" | "patch", path: string, cookies = a.business.auth.cookies) {
  return request(getTestApp())[method](`/api${path}`).set("Cookie", cookies).set("X-CSRF-Protection", "1");
}
function body(quantity = 5, idCustomer: number | null = a.customer.idCustomer, pricingType = "WHOLESALE", idProduct = a.product.idProduct, unitPrice = 10000) {
  const amount = quantity * unitPrice;
  return { pricingType, idCustomer, idDeposit: a.business.defaultDeposit.idDeposit, idCashSession: a.cash.idCashSession,
    subtotal: amount, discountTotal: 0, total: amount,
    items: [{ idProduct, quantity, unitPrice, discount: 0, total: amount }],
    payments: [{ idPaymentMethod: a.business.cashPaymentMethod.idPaymentMethod, amount, status: "CONFIRMED" }] };
}
function postSale(data = body(), key = randomUUID()) { return api("post", "/sales").set("Idempotency-Key", key).send(data); }
async function tier(id = a.customer.idCustomer) { return querySingleRow<RowDataPacket>("SELECT pricing_tier, wholesale_since FROM customers WHERE idBusiness=? AND idCustomer=?", [a.business.business.idBusiness, id]); }
async function freshCustomer() { return createCustomerFixture(a.business.business.idBusiness); }
async function promotedSale() {
  const customer = await freshCustomer(); const result = await postSale(body(5, customer.idCustomer));
  expect(result.status, result.text).toBe(201); return { customer, sale: result.body.data as SaleWithDetailsResponse };
}
async function preflight() {
  await assertTestConnection();
  if (!await querySingleRow<RowDataPacket>("SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active=1 LIMIT 1")) throw new Error("Existing active plan required");
  for (const [table, column] of [["businesses", "wholesale_enabled"], ["businesses", "wholesale_minimum_amount"], ["customers", "pricing_tier"], ["customers", "wholesale_since"], ["sales", "pricing_type"]]) {
    if (!await querySingleRow<RowDataPacket>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?", [table, column])) throw new Error("Apply F10.1 migration and procedures before gate");
  }
  const [parameters] = await pool.query<RowDataPacket[]>("SELECT PARAMETER_NAME FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA=DATABASE() AND SPECIFIC_NAME='sp_update_business' AND PARAMETER_MODE='IN'");
  if (parameters.length !== 8) throw new Error("Import F10.1 businesses.sql first");
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
    console.info(`F10.1 cleanup OK: ${runTag}, tenants=${ids.length}, users=${userIds.length}, FK checks preserved`);
}

describe("F10.1 real HTTP/DB gate — operator authorization required", function suite() {
  beforeAll(async function setup() {
    await preflight(); a = await scenario("a"); b = await scenario("b");
    const config = await api("patch", "/businesses/me").send({ wholesaleEnabled: true, wholesaleMinimumAmount: 50000 });
    expect(config.status, config.text).toBe(200);
    expect(config.body.data).toMatchObject({ wholesaleEnabled: true, wholesaleMinimumAmount: 50000 });
  });
  afterAll(async function cleanup() { await cleanupOwnFixtures(); });

  it("business wholesale defaults disabled and NULL; no global activation", async function disabled() {
    const business = await api("get", "/businesses", b.business.auth.cookies);
    expect(business.body.data).toMatchObject({ wholesaleEnabled: false, wholesaleMinimumAmount: null });
    const data = body(); data.idCustomer = b.customer.idCustomer; data.idDeposit = b.business.defaultDeposit.idDeposit;
    data.idCashSession = b.cash.idCashSession; data.items[0].idProduct = b.product.idProduct; data.payments[0].idPaymentMethod = b.business.cashPaymentMethod.idPaymentMethod;
    const result = await api("post", "/sales", b.business.auth.cookies).set("Idempotency-Key", randomUUID()).send(data);
    expect(result.status, result.text).toBe(400); expect(result.body.code).toBe("WHOLESALE_DISABLED");
  });
  it("RETAIL remains anonymous/manual and persists explicit history", async function retail() {
    const result = await postSale(body(1, null, "RETAIL", a.product.idProduct, 123));
    expect(result.status, result.text).toBe(201); expect(result.body.data).toMatchObject({ pricingType: "RETAIL", idCustomer: null });
  });
  it("WHOLESALE without Customer blocked", async function required() {
    const result = await postSale(body(5, null)); expect(result.status).toBe(400); expect(result.body.code).toBe("WHOLESALE_CUSTOMER_REQUIRED");
  });
  it("49999 wholesale candidate rejected despite 75000 retail price", async function below() {
    const customer = await freshCustomer(); const result = await postSale(body(1, customer.idCustomer, "WHOLESALE", a.below.idProduct, 49999));
    expect(result.body.code, result.text).toBe("WHOLESALE_MINIMUM_NOT_REACHED");
    expect(await tier(customer.idCustomer)).toMatchObject({ pricing_tier: "RETAIL", wholesale_since: null });
  });
  it("50000 exact promotes Customer with activation date and sale history", async function exact() {
    const { customer, sale } = await promotedSale(); expect(sale.pricingType).toBe("WHOLESALE");
    const row = await tier(customer.idCustomer); expect(row?.pricing_tier).toBe("WHOLESALE"); expect(row?.wholesale_since).not.toBeNull();
    const detail = await api("get", `/sales/${sale.idSale}`); expect(detail.body.data.pricingType).toBe("WHOLESALE");
    const list = await api("get", "/sales");
    expect(list.body.data.sales.find(function match(s: { idSale: number }) { return s.idSale === sale.idSale; }).pricingType).toBe("WHOLESALE");
  });
  it("above minimum promotes too", async function above() {
    const customer = await freshCustomer(); const result = await postSale(body(6, customer.idCustomer));
    expect(result.status, result.text).toBe(201); expect((await tier(customer.idCustomer))?.pricing_tier).toBe("WHOLESALE");
  });
  it("existing WHOLESALE buys 10000 and never overwrites wholesaleSince", async function persistentDate() {
    const { customer } = await promotedSale();
    // Scoped historical customer fixture distinguishes preservation even within the same DB second.
    await executeMutation("UPDATE customers SET wholesale_since='2001-01-01 12:00:00' WHERE idBusiness=? AND idCustomer=?", [a.business.business.idBusiness, customer.idCustomer]);
    const before = await tier(customer.idCustomer);
    const result = await postSale(body(1, customer.idCustomer)); expect(result.status, result.text).toBe(201);
    expect(await tier(customer.idCustomer)).toEqual(before);
  });
  it("product without wholesale price rejects and rolls back", async function missing() {
    const customer = await freshCustomer(); const result = await postSale(body(5, customer.idCustomer, "WHOLESALE", a.noWholesale.idProduct));
    expect(result.body.code, result.text).toBe("WHOLESALE_PRICE_MISSING"); expect((await tier(customer.idCustomer))?.pricing_tier).toBe("RETAIL");
  });
  it("forged unitPrice rejected rather than trusting request", async function mismatch() {
    const result = await postSale(body(5, a.customer.idCustomer, "WHOLESALE", a.product.idProduct, 20000));
    expect(result.body.code, result.text).toBe("WHOLESALE_PRICE_MISMATCH");
  });
  it("historical NULL remains compatible in list and detail", async function historical() {
    const result = await postSale(body(1, null, "RETAIL")); expect(result.status, result.text).toBe(201);
    const id = Number(result.body.data.idSale);
    // Only this test-owned Sale is made into a historical fixture; migration does not backfill.
    await executeMutation("UPDATE sales SET pricing_type=NULL WHERE idBusiness=? AND idSale=?", [a.business.business.idBusiness, id]);
    expect((await api("get", `/sales/${id}`)).body.data.pricingType).toBeNull();
    const list = await api("get", "/sales");
    expect(list.body.data.sales.find(function match(s: { idSale: number }) { return s.idSale === id; }).pricingType).toBeNull();
  });
  it("same-key replay preserves promotion/date/effect counts", async function replay() {
    const customer = await freshCustomer(), key = randomUUID(), data = body(5, customer.idCustomer);
    const first = await postSale(data, key); expect(first.status, first.text).toBe(201);
    const before = await tier(customer.idCustomer), count = await countRows("sales", "idBusiness=?", [a.business.business.idBusiness]);
    const retry = await postSale(data, key); expect(retry.status, retry.text).toBe(200);
    expect(retry.body.idempotentReplay).toBe(true); expect(retry.body.data.idSale).toBe(first.body.data.idSale);
    expect(await tier(customer.idCustomer)).toEqual(before); expect(await countRows("sales", "idBusiness=?", [a.business.business.idBusiness])).toBe(count);
  });
  it("cancellation does not downgrade Customer or rewrite pricing history", async function cancel() {
    const { customer, sale } = await promotedSale(), before = await tier(customer.idCustomer);
    const result = await api("patch", `/sales/${sale.idSale}/cancel`); expect(result.status, result.text).toBe(200);
    expect(await tier(customer.idCustomer)).toEqual(before); expect(result.body.data.pricingType).toBe("WHOLESALE");
  });
  it("full return/refund does not downgrade Customer", async function refund() {
    const { customer, sale } = await promotedSale(), before = await tier(customer.idCustomer);
    const result = await api("post", `/sales/${sale.idSale}/returns`).set("Idempotency-Key", randomUUID()).send({
      reason: "Devolucion total F10.1", items: [{ idSaleDetail: sale.items[0].idSaleDetail, quantity: 5, restock: true }],
      refunds: [{ idSalePayment: sale.payments[0].idSalePayment, amount: 50000 }], idCashSession: a.cash.idCashSession,
    });
    expect(result.status, result.text).toBe(201); expect(await tier(customer.idCustomer)).toEqual(before);
  });
  it("cross-tenant customer/product and forged tenant cannot cross boundaries", async function tenant() {
    const result = await postSale(body(5, b.customer.idCustomer)); expect(result.status).toBe(400); expect(result.body.code).toBe("WHOLESALE_CUSTOMER_INVALID");
    const product = await postSale(body(5, a.customer.idCustomer, "WHOLESALE", b.product.idProduct)); expect(product.body.code).toBe("WHOLESALE_PRICE_MISSING");
    const spoof = await postSale({ ...body(), idBusiness: b.business.business.idBusiness } as ReturnType<typeof body>);
    expect(spoof.status, spoof.text).toBe(201); expect(spoof.body.data.idBusiness).toBe(a.business.business.idBusiness);
    expect((await querySingleRow<RowDataPacket>("SELECT pricing_tier FROM customers WHERE idBusiness=? AND idCustomer=?", [b.business.business.idBusiness, b.customer.idCustomer]))?.pricing_tier).toBe("RETAIL");
  });
  it("inactive Customer cannot obtain wholesale Sale", async function inactive() {
    const customer = await freshCustomer();
    await executeMutation("UPDATE customers SET is_active=0 WHERE idBusiness=? AND idCustomer=?", [a.business.business.idBusiness, customer.idCustomer]);
    const result = await postSale(body(5, customer.idCustomer)); expect(result.body.code, result.text).toBe("WHOLESALE_CUSTOMER_INVALID");
  });
  it("insufficient stock after promotion attempt rolls back both Sale and Customer", async function rollback() {
    const customer = await freshCustomer(), key = randomUUID(); const result = await postSale(body(10001, customer.idCustomer), key);
    expect(result.status, result.text).toBe(400);
    expect(await tier(customer.idCustomer)).toMatchObject({ pricing_tier: "RETAIL", wholesale_since: null });
    expect(await countRows("sales", "idBusiness=? AND idempotency_key=?", [a.business.business.idBusiness, key])).toBe(0);
  });
  it("two concurrent qualifying sales promote one Customer without partial effects", async function race() {
    const customer = await freshCustomer();
    // Different cash sessions exercise customer locking, without cash-session serialization masking a race.
    const register = await createCashRegisterFixture(a.business.business.idBusiness);
    const cash = await createCashSessionFixture({ idBusiness: a.business.business.idBusiness, idCashRegister: register.idCashRegister, idUser: a.business.owner.idUser });
    const second = { ...body(5, customer.idCustomer), idCashSession: cash.idCashSession };
    const results = await Promise.all([postSale(body(5, customer.idCustomer)), postSale(second)]);
    for (const result of results) expect(result.status, result.text).toBe(201);
    expect(await countRows("sales", "idBusiness=? AND idCustomer=?", [a.business.business.idBusiness, customer.idCustomer])).toBe(2);
    expect((await tier(customer.idCustomer))?.pricing_tier).toBe("WHOLESALE");
  });
  it("concurrent same-key retry creates a single sale/promotion", async function concurrentReplay() {
    const customer = await freshCustomer(), key = randomUUID();
    const results = await Promise.all([postSale(body(5, customer.idCustomer), key), postSale(body(5, customer.idCustomer), key)]);
    expect(results.map(function status(r) { return r.status; }).sort()).toEqual([200, 201]);
    expect(await countRows("sales", "idBusiness=? AND idCustomer=?", [a.business.business.idBusiness, customer.idCustomer])).toBe(1);
  });
  it("public SQL reads selected tenant policy/prices without costs", async function catalog() {
    const [businessRows] = await pool.query<RowDataPacket[]>("CALL sp_storefront_get_catalog(?)", [a.business.business.slug]);
    const businesses = businessRows as unknown as RowDataPacket[][];
    expect(businesses[0][0]).toMatchObject({ wholesale_enabled: 1 });
    const [productRows] = await pool.query<RowDataPacket[]>("CALL sp_storefront_get_products(?, ?, ?, ?, ?)", [a.business.business.slug, 100, 0, null, null]);
    const products = productRows as unknown as RowDataPacket[][];
    const product = products[0].find(function match(p) { return p.idProduct === a.product.idProduct; });
    expect(Number(product?.price_wholesale)).toBe(10000); expect(Number(product?.price_sale)).toBe(15000);
    for (const row of products[0]) { expect(row).not.toHaveProperty("price_cost"); expect(row.idBusiness).toBeUndefined(); }
  });
});
