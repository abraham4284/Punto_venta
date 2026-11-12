import { readFileSync } from "node:fs";
import express from "express";
import type { RequestHandler } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(function fixtures() {
  const connection = {
    beginTransaction: vi.fn(), query: vi.fn(), commit: vi.fn(),
    rollback: vi.fn(), release: vi.fn(), destroy: vi.fn(),
  };
  return {
    connection, getConnection: vi.fn(), poolQuery: vi.fn(), notify: vi.fn(),
    permission: vi.fn(),
  };
});

vi.mock("@/db/db.js", function database() {
  return { pool: { getConnection: mocks.getConnection, query: mocks.poolQuery } };
});
vi.mock("@/modules/notifications/services/notifications.service.js", function notifications() {
  return { safeEvaluateStockNotification: mocks.notify };
});
vi.mock("@/middlewares/requireAuth.js", function auth() {
  const requireAuth: RequestHandler = function authenticate(req, res, next) {
    if (!req.headers.authorization) {
      res.sendStatus(401);
      return;
    }
    req.user = { idBusiness: 7, idUser: 8, role: "OWNER" };
    next();
  };
  return { requireAuth };
});
vi.mock("@/middlewares/requirePermission.middleware.js", function permissions() {
  return { requirePermission: function requirePermission(permission: string): RequestHandler {
    return function authorize(req, res, next) {
      mocks.permission(permission);
      if (req.headers.authorization === "denied") {
        res.sendStatus(403);
        return;
      }
      next();
    };
  } };
});

import routes from "@/modules/businesses-app/stock_movements/routes/stock_movements.routes.js";
import { processStockTransfersService } from "@/modules/businesses-app/stock_movements/services/stock_movements.service.js";
import { processStockTransfersSchema } from "@/modules/businesses-app/stock_movements/validations/stock_movements.validations.js";

const app = express().use(express.json()).use("/api", routes);
const path = "/api/stock-movements/transfers";
const body = {
  idDepositFrom: 3, idDepositTo: 2, observation: " Envio ",
  items: [{ idProduct: 22, quantity: 2 }, { idProduct: 11, quantity: 3 }],
};
const data = { ...body, observation: "Envio", idBusiness: 7, idUser: 8 };
const createdAt = new Date("2026-11-11T12:00:00Z");
const applied = [[[{ referenceId: "100", createdAt, productName: "Producto", unitType: "UNIT" }]]];
const unitError = { sqlState: "45000", sqlMessage: "Los productos por unidad solo permiten cantidades enteras" };

beforeEach(function reset() {
  vi.resetAllMocks();
  mocks.getConnection.mockResolvedValue(mocks.connection);
  mocks.connection.query.mockResolvedValue(applied);
  mocks.notify.mockResolvedValue(undefined);
});

describe("T1 request validation", function schema() {
  it.each([
    { idDepositTo: 3 }, { idDepositFrom: 0 }, { items: [] },
    { items: [{ idProduct: 11, quantity: 0 }] },
    { items: [{ idProduct: 11, quantity: -1 }] },
    { items: [{ idProduct: 11, quantity: 0.001 }] },
    { items: [{ idProduct: 11.5, quantity: 1 }] },
    { items: [{ idProduct: 11, quantity: 1, stockAvailable: 99 }] },
    { items: [{ idProduct: 11, quantity: 1 }, { idProduct: 11, quantity: 2 }] },
    { items: Array.from({ length: 101 }, (_, index) => ({ idProduct: index + 1, quantity: 1 })) },
    { idBusiness: 99 }, { idUser: 99 }, { observation: "a".repeat(256) },
  ])("rejects invalid payload %#", function invalid(override) {
    expect(processStockTransfersSchema.safeParse({ ...body, ...override }).success).toBe(false);
  });
  it("accepts fractional quantities for SQL unit validation and normalizes observation", function fractional() {
    const parsed = processStockTransfersSchema.parse({ ...body, items: [{ idProduct: 11, quantity: 0.25 }] });
    expect(parsed.items[0].quantity).toBe(0.25);
    expect(parsed.observation).toBe("Envio");
  });
});

describe("T1 transaction and HTTP contract", function contract() {
  it("uses authenticated tenant and actor, sorts calls and evaluates each stock pair after release", async function successfulBatch() {
    const response = await request(app).post(path).set("Authorization", "owner").send(body);
    expect(response.status, response.text).toBe(200);
    expect(response.body.data).toMatchObject({
      referenceId: 100, idDepositFrom: 3, idDepositTo: 2, idUser: 8, observation: "Envio",
      createdAt: createdAt.toISOString(), totalQuantity: 5, movementCount: 4,
      items: [{ idProduct: 11, quantity: 3 }, { idProduct: 22, quantity: 2 }],
    });
    expect(mocks.permission).toHaveBeenCalledWith("stock.transfer");
    expect(mocks.getConnection).toHaveBeenCalledOnce();
    expect(mocks.connection.beginTransaction).toHaveBeenCalledOnce();
    expect(mocks.connection.query.mock.calls.map(function args(call) { return call[1]; })).toEqual([
      [7, 8, 11, 3, 2, "3.00", "Envio", null],
      [7, 8, 22, 3, 2, "2.00", "Envio", 100],
    ]);
    expect(mocks.connection.commit).toHaveBeenCalledOnce();
    expect(mocks.connection.rollback).not.toHaveBeenCalled();
    expect(mocks.connection.release).toHaveBeenCalledOnce();
    expect(mocks.connection.beginTransaction).toHaveBeenCalledBefore(mocks.connection.query);
    expect(mocks.connection.query).toHaveBeenCalledBefore(mocks.connection.commit);
    expect(mocks.connection.commit).toHaveBeenCalledBefore(mocks.connection.release);
    expect(mocks.connection.release).toHaveBeenCalledBefore(mocks.notify);
    expect(mocks.poolQuery).not.toHaveBeenCalled();
    expect(mocks.notify.mock.calls).toEqual([
      [{ idBusiness: 7, idProduct: 11, idDeposit: 3 }],
      [{ idBusiness: 7, idProduct: 11, idDeposit: 2 }],
      [{ idBusiness: 7, idProduct: 22, idDeposit: 3 }],
      [{ idBusiness: 7, idProduct: 22, idDeposit: 2 }],
    ]);
  });

  it("rolls back a later UNIT failure and skips remaining items", async function fractionalUnit() {
    mocks.connection.query.mockResolvedValueOnce(applied).mockRejectedValueOnce(unitError);
    const response = await request(app).post(path).set("Authorization", "owner").send({
      ...body, items: [...body.items, { idProduct: 33, quantity: 1 }].map(function fractional(item) {
        return item.idProduct === 22 ? { ...item, quantity: 0.25 } : item;
      }),
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(unitError.sqlMessage);
    expect(mocks.connection.query).toHaveBeenCalledTimes(2);
    expect(mocks.connection.query.mock.calls[1][1][5]).toBe("0.25");
    expect(mocks.connection.rollback).toHaveBeenCalledOnce();
    expect(mocks.connection.release).toHaveBeenCalledOnce();
    expect(mocks.connection.commit).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.poolQuery).not.toHaveBeenCalled();
  });

  it.each(["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"])("returns 409 for %s", async function conflict(code) {
    mocks.connection.query.mockRejectedValue({ code, sqlMessage: "Internal SQL details" });
    const response = await request(app).post(path).set("Authorization", "owner").send(body);
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("STOCK_TRANSFER_CONCURRENT_CHANGE");
    expect(response.text).not.toContain("Internal SQL details");
    expect(mocks.connection.rollback).toHaveBeenCalledOnce();
    expect(mocks.connection.release).toHaveBeenCalledOnce();
  });

  it("returns a safe error and rolls back if commit fails", async function commitFailure() {
    mocks.connection.commit.mockRejectedValue(new Error("Internal DB details"));
    const response = await request(app).post(path).set("Authorization", "owner").send(body);
    expect(response.status).toBe(500);
    expect(response.text).not.toContain("Internal DB details");
    expect(mocks.connection.rollback).toHaveBeenCalledOnce();
    expect(mocks.connection.release).toHaveBeenCalledOnce();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("returns the committed transfer even if an alert fails", async function notificationFailure() {
    mocks.notify.mockRejectedValueOnce(new Error("alert failed"));
    await expect(processStockTransfersService(data)).resolves.toMatchObject({ referenceId: 100 });
    expect(mocks.connection.commit).toHaveBeenCalledOnce();
    expect(mocks.connection.rollback).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledTimes(4);
  });

  it("rejects forged identity fields before acquiring a connection", async function forged() {
    await request(app).post(path).set("Authorization", "owner").send({ ...body, idBusiness: 99, idUser: 99 }).expect(400);
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });

  it("requires authentication and stock.transfer", async function unauthorized() {
    await request(app).post(path).send(body).expect(401);
    await request(app).post(path).set("Authorization", "denied").send(body).expect(403);
    expect(mocks.permission).toHaveBeenCalledWith("stock.transfer");
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });

  it("keeps the singular request, permission and movement array contract", async function singular() {
    mocks.poolQuery.mockResolvedValue([[[]]]);
    const response = await request(app).post("/api/stock-movements/transfer").set("Authorization", "owner")
      .send({ idDepositFrom: 3, idDepositTo: 2, idProduct: 11, quantity: 2 });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(mocks.permission).toHaveBeenCalledWith("stock.transfer");
    expect(mocks.poolQuery).toHaveBeenCalledWith("CALL sp_process_stock_transfer(?, ?, ?, ?, ?, ?, ?)", [7, 8, 11, 3, 2, 2, null]);
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });
});

it("keeps SQL ownership at the caller and locks stock before checking availability", function sqlContract() {
  const sql = readFileSync(new URL("../../db/procedures/stock_movements.sql", import.meta.url), "utf8");
  const item = sql.split("CREATE PROCEDURE sp_apply_stock_transfer_item(")[1].split("END$$")[0];
  const wrapper = sql.split("CREATE PROCEDURE sp_process_stock_transfer(")[1].split("END$$")[0];
  expect(item).not.toMatch(/START TRANSACTION|COMMIT|ROLLBACK/);
  expect(item).toMatch(/idDeposit = v_deposit_low\s+FOR UPDATE;[\s\S]*idDeposit = v_deposit_high\s+FOR UPDATE;[\s\S]*IF v_source < p_quantity/);
  expect(item).toContain("ON DUPLICATE KEY UPDATE");
  expect(item).toContain("IF v_unit_type = 'UNIT' AND p_quantity <> FLOOR(p_quantity)");
  expect(wrapper).toMatch(/START TRANSACTION;\s+CALL sp_apply_stock_transfer_item\([\s\S]*COMMIT;[\s\S]*CALL sp_get_stock_movements/);
});
