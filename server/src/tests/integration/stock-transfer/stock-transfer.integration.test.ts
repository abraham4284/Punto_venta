import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/db/db.js";
import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createDepositFixture } from "@/tests/fixtures/deposit.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { countRows, getStockMovementRows } from "@/tests/helpers/economic-db-test.helper.js";
import { executeInsert, executeMutation, querySingleRow, validateTestDatabaseEnvironment } from "@/tests/helpers/test-database.helper.js";

const tag = `t1_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
const slugPrefix = `negocio-${tag}`;
let a: Awaited<ReturnType<typeof scenario>>;
let b: Awaited<ReturnType<typeof scenario>>;
let fixturesStarted = false;

async function assertTestConnection() {
  validateTestDatabaseEnvironment();
  if (process.env.NODE_ENV !== "test" ||
      !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? "")) {
    throw new Error("T1 requires an authorized test database on loopback");
  }
  const row = await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db");
  if (row?.db !== "punto_venta_integration_test") throw new Error("T1 unexpected database");
}

async function scenario(label: string) {
  const fixture = await createOperationalBusinessFixture(`${tag}_${label}`);
  const idBusiness = fixture.business.idBusiness;
  const from = fixture.defaultDeposit.idDeposit;
  const to = (await createDepositFixture(idBusiness)).idDeposit;
  const { idProductCategory } = await createProductCategoryFixture(idBusiness);
  return {
    idBusiness, from, to, idUser: fixture.owner.idUser, cookies: fixture.auth.cookies,
    async product(quantity: number, destination?: number) {
      const { idProduct } = await createProductFixture({ idBusiness, idProductCategory, idDeposit: from, quantity });
      if (destination !== undefined) {
        await executeInsert(
          "INSERT INTO stock (idBusiness, idProduct, idDeposit, quantity) VALUES (?, ?, ?, ?)",
          [idBusiness, idProduct, to, destination],
        );
      }
      return idProduct;
    },
  };
}

async function quantity(idProduct: number, idDeposit: number): Promise<number | null> {
  const row = await querySingleRow<RowDataPacket>(
    "SELECT quantity FROM stock WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?",
    [a.idBusiness, idProduct, idDeposit],
  );
  return row ? Number(row.quantity) : null;
}

function batch(items: { idProduct: number; quantity: number }[], from = a.from, to = a.to) {
  return request(getTestApp()).post("/api/stock-movements/transfers").set("Cookie", a.cookies)
    .send({ idDepositFrom: from, idDepositTo: to, items });
}

async function snapshot() {
  const [stock] = await pool.query<RowDataPacket[]>("SELECT * FROM stock WHERE idBusiness IN (?, ?) ORDER BY idStock", [a.idBusiness, b.idBusiness]);
  const [movements] = await pool.query<RowDataPacket[]>("SELECT * FROM stock_movements WHERE idBusiness IN (?, ?) ORDER BY idStockMovement", [a.idBusiness, b.idBusiness]);
  return { stock, movements };
}

async function cleanup() {
  if (!fixturesStarted) return;
  await assertTestConnection();
  const [businesses] = await pool.query<RowDataPacket[]>(
    "SELECT idBusiness FROM businesses WHERE LEFT(slug, ?) = ?", [slugPrefix.length, slugPrefix],
  );
  const [users] = await pool.query<RowDataPacket[]>(
    "SELECT idUser FROM users WHERE LEFT(username, ?) = ?", [tag.length, tag],
  );
  const businessIds = businesses.map(function businessId(row) { return Number(row.idBusiness); });
  const userIds = users.map(function userId(row) { return Number(row.idUser); });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (businessIds.length) {
      await connection.query("DELETE nr FROM notification_recipients nr JOIN notifications n ON n.idNotification = nr.idNotification WHERE n.idBusiness IN (?)", [businessIds]);
      await connection.query("DELETE e FROM subscription_events e JOIN business_subscriptions s ON s.idBusinessSubscription = e.idBusinessSubscription WHERE s.idBusiness IN (?)", [businessIds]);
      await connection.query("DELETE p FROM subscription_payments p JOIN business_subscriptions s ON s.idBusinessSubscription = p.idBusinessSubscription WHERE s.idBusiness IN (?)", [businessIds]);
      for (const table of ["notifications", "stock_movements", "stock", "products", "product_categories", "deposits",
        "cash_registers", "payment_methods", "legal_acceptances", "business_user_permissions",
        "business_subscriptions", "user_sessions", "business_users", "businesses"]) {
        await connection.query(`DELETE FROM \`${table}\` WHERE idBusiness IN (?)`, [businessIds]);
      }
    }
    if (userIds.length) {
      await connection.query("DELETE FROM user_sessions WHERE idUser IN (?)", [userIds]);
      await connection.query("DELETE FROM users WHERE idUser IN (?)", [userIds]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  expect(await countRows("businesses", "LEFT(slug, ?) = ?", [slugPrefix.length, slugPrefix])).toBe(0);
  expect(await countRows("users", "LEFT(username, ?) = ?", [tag.length, tag])).toBe(0);
}

describe("T1 stock transfers on real HTTP and MySQL", function suite() {
  beforeAll(async function setup() {
    await assertTestConnection();
    const wrapper = await querySingleRow<RowDataPacket>("SHOW CREATE PROCEDURE sp_process_stock_transfer");
    const helper = await querySingleRow<RowDataPacket>("SHOW CREATE PROCEDURE sp_apply_stock_transfer_item");
    if (!wrapper?.["Create Procedure"]?.includes("sp_apply_stock_transfer_item") || !helper?.["Create Procedure"]) {
      throw new Error("Apply canonical stock_movements.sql before the authorized T1 gate");
    }
    if (!await querySingleRow<RowDataPacket>("SELECT idSubscriptionPlan FROM subscription_plans WHERE is_active = 1 LIMIT 1")) {
      throw new Error("T1 requires an existing active plan for fixtures");
    }
    fixturesStarted = true;
    a = await scenario("a");
    b = await scenario("b");
  });
  afterAll(cleanup);

  describe("T2.2 durable transfer history", function history() {
    beforeAll(async function preflight() {
      const [index] = await pool.query<RowDataPacket[]>(
        "SELECT COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_movements' AND INDEX_NAME = 'idx_stock_movements_business_reference' ORDER BY SEQ_IN_INDEX",
      );
      expect(index.map(function column(row) { return row.COLUMN_NAME; })).toEqual(["idBusiness", "reference_type", "reference_id"]);
      const listing = await querySingleRow<RowDataPacket>("SHOW CREATE PROCEDURE sp_get_stock_movements");
      expect(listing?.["Create Procedure"]).toContain("v_transfer_reference");
    });

    function historyRequest(referenceId: number, cookies = a.cookies) {
      return request(getTestApp()).get(`/api/stock-movements/transfers/${referenceId}`).set("Cookie", cookies);
    }

    it("reconstructs the whole batch and searches both reference formats across pagination", async function batchHistory() {
      const first = await a.product(10);
      const second = await a.product(8);
      const sent = await batch([{ idProduct: second, quantity: 2 }, { idProduct: first, quantity: 3 }]).expect(200);
      const { referenceId, createdAt } = sent.body.data;
      const response = await historyRequest(referenceId).expect(200);
      expect(response.body.data).toMatchObject({
        referenceId, createdAt, idUser: a.idUser, idDepositFrom: a.from, idDepositTo: a.to, movementCount: 4,
        items: [{ idProduct: first, quantity: 3 }, { idProduct: second, quantity: 2 }],
      });
      for (const search of [String(referenceId), `#${referenceId}`]) {
        const list = await request(getTestApp()).get("/api/stock-movements").set("Cookie", a.cookies)
          .query({ movementType: "TRANSFER", search, limit: 1 }).expect(200);
        expect(list.body.data.pagination.totalRecords).toBe(4);
        expect(list.body.data.movements).toHaveLength(1);
        expect(Number(list.body.data.movements[0].referenceId)).toBe(referenceId);
      }
      const foreign = await historyRequest(referenceId, b.cookies).expect(404);
      const absent = await historyRequest(Number.MAX_SAFE_INTEGER).expect(404);
      expect(foreign.body).toEqual(absent.body);
    });

    it("reprints individual stock movements after the product and destination are deactivated", async function individualHistory() {
      const idProduct = await a.product(10);
      const target = await createDepositFixture(a.idBusiness);
      await request(getTestApp()).post("/api/stock-movements/transfer").set("Cookie", a.cookies)
        .send({ idProduct, idDepositFrom: a.from, idDepositTo: target.idDeposit, quantity: 2, observation: "Histórico" }).expect(200);
      const [out] = await getStockMovementRows({ idBusiness: a.idBusiness, idProduct, referenceType: "TRANSFER" });
      await executeMutation("UPDATE products SET is_active=0 WHERE idBusiness=? AND idProduct=?", [a.idBusiness, idProduct]);
      await executeMutation("UPDATE deposits SET is_active=0 WHERE idBusiness=? AND idDeposit=?", [a.idBusiness, target.idDeposit]);
      const response = await historyRequest(Number(out.reference_id)).expect(200);
      expect(response.body.data).toMatchObject({
        movementCount: 2, observation: "Histórico", depositToName: target.name, items: [{ idProduct, quantity: 2 }],
      });
    });
  });

  it("moves two products, conserves balances and groups both movement pairs", async function success() {
    const first = await a.product(10, 1);
    const second = await a.product(8, 2);
    const response = await batch([{ idProduct: second, quantity: 2 }, { idProduct: first, quantity: 3 }]);
    expect(response.status, response.text).toBe(200);
    expect(response.body.data).toMatchObject({ idUser: a.idUser, movementCount: 4, totalQuantity: 5 });
    expect([await quantity(first, a.from), await quantity(first, a.to)]).toEqual([7, 4]);
    expect([await quantity(second, a.from), await quantity(second, a.to)]).toEqual([6, 4]);
    const referenceId = Number(response.body.data.referenceId);
    const moves = await getStockMovementRows({ idBusiness: a.idBusiness, referenceType: "TRANSFER", referenceId });
    expect(moves).toHaveLength(4);
    expect(moves[0].idStockMovement).toBe(referenceId);
    for (const idProduct of [first, second]) {
      const pair = moves.filter(function product(row) { return row.idProduct === idProduct; });
      expect(pair.map(function type(row) { return row.movement_type; })).toEqual(["TRANSFER_OUT", "TRANSFER_IN"]);
      for (const row of pair) {
        expect(Number(row.reference_id)).toBe(referenceId);
        expect(row).toMatchObject({ idUser: a.idUser, idDepositFrom: a.from, idDepositTo: a.to });
        expect(Number(row.quantity)).toBe(idProduct === first ? 3 : 2);
      }
    }
  });

  it("rolls back earlier stock changes, movements and destination creation on insufficient stock", async function rollback() {
    const first = await a.product(10);
    const second = await a.product(1);
    const before = await snapshot();
    await batch([{ idProduct: first, quantity: 2 }, { idProduct: second, quantity: 2 }]).expect(400);
    expect(await snapshot()).toEqual(before);
    expect(await quantity(first, a.to)).toBeNull();
  });

  it("creates missing destination stock and accepts supported decimals for KG", async function missingDestination() {
    const idProduct = await a.product(10);
    await executeMutation("UPDATE products SET unit_type = 'KG' WHERE idBusiness = ? AND idProduct = ?", [a.idBusiness, idProduct]);
    expect(await quantity(idProduct, a.to)).toBeNull();
    await batch([{ idProduct, quantity: 2.25 }]).expect(200);
    expect([await quantity(idProduct, a.from), await quantity(idProduct, a.to)]).toEqual([7.75, 2.25]);
  });

  it("rejects identical deposits without effects", async function sameDeposit() {
    const idProduct = await a.product(10);
    const before = await snapshot();
    await batch([{ idProduct, quantity: 1 }], a.from, a.from).expect(400);
    expect(await snapshot()).toEqual(before);
  });

  it("rolls back when a later UNIT item is fractional", async function fractional() {
    const first = await a.product(10);
    const second = await a.product(8);
    const before = await snapshot();
    const response = await batch([{ idProduct: first, quantity: 2 }, { idProduct: second, quantity: 0.5 }]).expect(400);
    expect(response.body.message).toContain("cantidades enteras");
    expect(await snapshot()).toEqual(before);
  });

  it("rejects a foreign product and foreign deposit without touching either tenant", async function isolation() {
    const own = await a.product(10);
    const foreign = await b.product(10);
    const before = await snapshot();
    await batch([{ idProduct: own, quantity: 1 }], a.from, b.to).expect(400);
    await batch([{ idProduct: own, quantity: 1 }, { idProduct: foreign, quantity: 1 }]).expect(400);
    expect(await snapshot()).toEqual(before);
  });

  it("rejects an inactive product and an inactive destination", async function inactive() {
    const active = await a.product(10);
    const inactive = await a.product(10);
    const disabled = await createDepositFixture(a.idBusiness);
    await executeMutation("UPDATE deposits SET is_active = 0 WHERE idBusiness = ? AND idDeposit = ?", [a.idBusiness, disabled.idDeposit]);
    await executeMutation("UPDATE products SET is_active = 0 WHERE idBusiness = ? AND idProduct = ?", [a.idBusiness, inactive]);
    const before = await snapshot();
    await batch([{ idProduct: inactive, quantity: 1 }]).expect(400);
    await batch([{ idProduct: active, quantity: 1 }], a.from, disabled.idDeposit).expect(400);
    expect(await snapshot()).toEqual(before);
  });

  it("keeps the singular response and can relocate existing inactive product stock", async function single() {
    const idProduct = await a.product(10);
    await executeMutation("UPDATE products SET is_active = 0 WHERE idBusiness = ? AND idProduct = ?", [a.idBusiness, idProduct]);
    const response = await request(getTestApp()).post("/api/stock-movements/transfer").set("Cookie", a.cookies)
      .send({ idProduct, idDepositFrom: a.from, idDepositTo: a.to, quantity: 3 }).expect(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect([await quantity(idProduct, a.from), await quantity(idProduct, a.to)]).toEqual([7, 3]);
    const moves = await getStockMovementRows({ idBusiness: a.idBusiness, idProduct, referenceType: "TRANSFER" });
    expect(moves).toHaveLength(2);
    expect(moves[0].reference_id).toBe(moves[1].reference_id);
    expect(Number(moves[0].reference_id)).toBe(moves[0].idStockMovement);
  });

  it("allows only one of two concurrent transfers to consume the same available stock", async function concurrent() {
    const idProduct = await a.product(5);
    const results = await Promise.all([
      batch([{ idProduct, quantity: 5 }]),
      request(getTestApp()).post("/api/stock-movements/transfer").set("Cookie", a.cookies)
        .send({ idProduct, idDepositFrom: a.from, idDepositTo: a.to, quantity: 5 }),
    ]);
    expect(results.filter(function winner(response) { return response.status === 200; })).toHaveLength(1);
    expect(results.every(function expected(response) { return [200, 400, 409].includes(response.status); })).toBe(true);
    expect([await quantity(idProduct, a.from), await quantity(idProduct, a.to)]).toEqual([0, 5]);
    expect(await getStockMovementRows({ idBusiness: a.idBusiness, idProduct, referenceType: "TRANSFER" })).toHaveLength(2);
  });
});
