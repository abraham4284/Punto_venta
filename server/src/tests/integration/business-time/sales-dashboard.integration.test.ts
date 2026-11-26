import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { executeInsert, querySingleRow, validateTestDatabaseEnvironment } from "@/tests/helpers/test-database.helper.js";
import { countRows } from "@/tests/helpers/economic-db-test.helper.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import type { OperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createCashSessionFixture } from "@/tests/fixtures/cash-session.fixture.js";
import { businessDateTimeToDate, businessPeriods, currentBusinessDate, nextBusinessDate } from "@/helpers/business-time.helper.js";
import { getDashboardDataService } from "@/modules/businesses-app/dashboard/services/dashboard.service.js";

const runTag = "datetest_" + randomUUID().replaceAll("-", "").slice(0, 12);
let tenant: OperationalBusinessFixture;
let other: OperationalBusinessFixture;
let fixturesStarted = false;
let day: string;
const rows: { date: string; total: number; status: "COMPLETED" | "CANCELLED" }[] = [];

async function assertTestConnection() {
  validateTestDatabaseEnvironment();
  if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? "")) {
    throw new Error("Business-date gate is restricted to the authorized loopback test DB");
  }
  if ((await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db"))?.db !== "punto_venta_integration_test") {
    throw new Error("Unexpected test database");
  }
}

async function preflight() {
  await assertTestConnection();
  const clock = await querySingleRow<RowDataPacket>(
    "SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS wallClock, DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%d %H:%i:%s') AS utcClock",
  );
  if (!clock || Math.abs(businessDateTimeToDate(String(clock.wallClock)).getTime() -
      Date.parse(String(clock.utcClock).replace(" ", "T") + "Z")) > 1000) {
    throw new Error("Verify the MySQL session writes in Argentine time before running this gate");
  }
  if (!await querySingleRow<RowDataPacket>("SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active=1 LIMIT 1")) {
    throw new Error("An existing active test plan is required");
  }
  // A signed-off SQL install is required, before this gate owns any fixture.
  for (const [file, name] of [
    ["sales", "sp_get_sales"], ["purchases", "sp_get_purchases_by_business"],
    ["dashboard", "sp_get_dashboard_metrics"], ["dashboard", "sp_get_dashboard_charts_and_lists"],
  ]) {
    const source = readFileSync(new URL(`../../../db/procedures/${file}.sql`, import.meta.url), "utf8");
    const body = source.split(`CREATE PROCEDURE ${name}(`)[1].split("END$$")[0];
    const definition = await querySingleRow<RowDataPacket>(`SHOW CREATE PROCEDURE ${name}`);
    const installed = String(definition?.["Create Procedure"] ?? "");
    const canonicalBody = body.slice(body.indexOf("BEGIN"));
    const installedBody = installed.slice(installed.indexOf("BEGIN"));
    const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
    if (normalize(installedBody) !== normalize(canonicalBody + "END")) throw new Error("Install current canonical procedures before the gate");
  }
}

function api(path: string, business = tenant) {
  return request(getTestApp()).get("/api" + path).set("Cookie", business.auth.cookies);
}

async function insertRecords(business: OperationalBusinessFixture, data: typeof rows) {
  const idBusiness = business.business.idBusiness;
  const session = await createCashSessionFixture({
    idBusiness, idUser: business.owner.idUser, idCashRegister: business.defaultCashRegister.idCashRegister,
  });
  for (const row of data) {
    const idSale = await executeInsert(
      `INSERT INTO sales (idBusiness, idDeposit, idCashSession, idUser, idPaymentMethod, sale_number,
        idempotency_key, sale_date, subtotal, discount_total, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [idBusiness, business.defaultDeposit.idDeposit, session.idCashSession, business.owner.idUser,
        business.cashPaymentMethod.idPaymentMethod, "DATE-" + randomUUID(), randomUUID(), row.date, row.total, row.total, row.status],
    );
    await executeInsert(
      "INSERT INTO sale_payments (idBusiness, idSale, idPaymentMethod, amount, status, created_by_user_id) VALUES (?, ?, ?, ?, 'CONFIRMED', ?)",
      [idBusiness, idSale, business.cashPaymentMethod.idPaymentMethod, row.total, business.owner.idUser],
    );
    await executeInsert(
      `INSERT INTO purchases (idBusiness, idUser, purchase_number, idempotency_key, purchase_date, subtotal, discount_total, total, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [idBusiness, business.owner.idUser, "DATE-" + randomUUID(), randomUUID(), row.date, row.total, row.total, row.status],
    );
  }
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
    console.info(`Business-date cleanup OK: ${runTag}, tenants=${ids.length}, users=${userIds.length}, FK checks preserved`);
}

describe("Business-date HTTP/MySQL gate, operator authorization required", function gate() {
  beforeAll(async function setup() {
    await preflight();
    fixturesStarted = true;
    tenant = await createOperationalBusinessFixture(runTag + "_a");
    other = await createOperationalBusinessFixture(runTag + "_b");
    day = currentBusinessDate(new Date());
    const previous = new Date(day + "T00:00:00Z");
    previous.setUTCDate(previous.getUTCDate() - 1);
    rows.push(
      { date: previous.toISOString().slice(0, 10) + " 23:59:00", total: 100000, status: "COMPLETED" },
      { date: day + " 00:00:00", total: 10000, status: "COMPLETED" },
      { date: day + " 00:30:00", total: 20000, status: "COMPLETED" },
      { date: day + " 20:59:00", total: 30000, status: "COMPLETED" },
      { date: day + " 21:00:00", total: 40000, status: "COMPLETED" },
      { date: day + " 23:59:00", total: 50000, status: "COMPLETED" },
      { date: day + " 15:00:00", total: 90000, status: "CANCELLED" },
      { date: nextBusinessDate(day) + " 00:00:00", total: 200000, status: "COMPLETED" },
    );
    await insertRecords(tenant, rows);
    await insertRecords(other, [{ date: day + " 12:00:00", total: 999999, status: "COMPLETED" }]);
  });
  afterAll(async function cleanup() { if (fixturesStarted) await cleanupOwnFixtures(); });

  it("matches History COMPLETED and Dashboard today for Sales and Purchases", async function parity() {
    expect(currentBusinessDate(new Date())).toBe(day); // Rerun if setup crossed a commercial midnight.
    const history = await api("/sales").query({ startDate: day, endDate: day, status: "COMPLETED", limit: 100 });
    const dashboard = await api("/dashboard/metrics");
    expect(history.status, history.text).toBe(200);
    expect(dashboard.status, dashboard.text).toBe(200);
    expect(history.body.data.metrics).toMatchObject({ total: 5, completed: 5, completedTotal: 150000 });
    expect(dashboard.body.data.metrics).toMatchObject({
      todaySalesCount: 5, todaySalesTotal: 150000, todayPurchasesCount: 5, todayPurchasesTotal: 150000,
    });
    expect(dashboard.body.data.metrics.todaySalesCount).toBe(history.body.data.sales.length);
    for (const sale of history.body.data.sales) expect(currentBusinessDate(new Date(sale.saleDate))).toBe(day);
    const purchases = await api("/purchases").query({ startDate: day, endDate: day, status: "COMPLETED", limit: 100 });
    expect(purchases.status, purchases.text).toBe(200);
    expect(purchases.body.data.purchases).toHaveLength(5);
  });
  it("keeps listing and summary aligned with open, multi-day and inclusive calendar ends", async function ranges() {
    const yesterday = rows[0].date.slice(0, 10);
    for (const [filters, total] of [
      [{ startDate: yesterday, endDate: day }, 7],
      [{ startDate: day }, 7], [{ endDate: day }, 7],
      [{ startDate: day, endDate: day }, 6],
    ] as const) {
      const result = await api("/sales").query({ ...filters, limit: 100 });
      expect(result.status, result.text).toBe(200);
      expect(result.body.data.pagination.totalRecords).toBe(total);
      expect(result.body.data.sales).toHaveLength(total);
      expect(result.body.data.metrics.total).toBe(total);
    }
  });
  it("classifies monthly totals, tickets, payment chart and yearly graph in the commercial calendar", async function months() {
    const edges = [
      { date: "2026-11-30 23:59:00", total: 111, status: "COMPLETED" as const },
      { date: "2026-12-01 00:00:00", total: 222, status: "COMPLETED" as const },
      { date: "2026-12-01 00:30:00", total: 333, status: "COMPLETED" as const },
      { date: "2026-12-31 23:59:00", total: 444, status: "COMPLETED" as const },
      { date: "2027-01-01 00:00:00", total: 555, status: "COMPLETED" as const },
    ];
    await insertRecords(tenant, edges);
    for (const date of ["2026-11-30 23:59:00", "2026-12-01 00:30:00", "2027-01-01 00:00:00"]) {
      const now = businessDateTimeToDate(date);
      const bounds = businessPeriods(now);
      const matches = [...rows, ...edges].filter(function month(row) {
        return row.status === "COMPLETED" && row.date >= bounds.monthStart && row.date < bounds.nextMonthStart;
      });
      const sum = matches.reduce(function total(sum, row) { return sum + row.total; }, 0);
      const data = await getDashboardDataService(tenant.business.idBusiness, undefined, now);
      expect(data.metrics.monthSalesTotal).toBe(sum);
      expect(data.metrics.monthPurchasesTotal).toBe(sum);
      expect(data.metrics.monthAverageTicket).toBeCloseTo(sum / matches.length, 2);
      expect(data.metrics.monthAveragePurchase).toBeCloseTo(sum / matches.length, 2);
      expect(data.salesByPaymentMethod.reduce(function total(sum, method) { return sum + method.totalAmount; }, 0)).toBe(sum);
      expect(data.monthlySales[Number(date.slice(5, 7)) - 1].totalAmount).toBe(sum);
      expect(data.monthlySales[Number(date.slice(5, 7)) - 1].salesCount).toBe(matches.length);
    }
  });
});

