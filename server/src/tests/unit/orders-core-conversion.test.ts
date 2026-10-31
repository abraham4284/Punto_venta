import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { Request, Response, RequestHandler } from "express";
const mocks = vi.hoisted(function mocks() { return { query: vi.fn(), poolQuery: vi.fn(), begin: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(), getConnection: vi.fn(), notify: vi.fn() }; });
vi.mock("@/db/db.js", function db() { return { pool: { query: mocks.poolQuery, getConnection: mocks.getConnection } }; });
vi.mock("@/modules/notifications/services/notifications.service.js", function notifications() { return { safeEvaluateStockNotification: mocks.notify }; });
import { convertOrderToSaleService } from "../../modules/businesses-app/orders/services/order-conversion.service.js";
import { orderConversionSchema } from "../../modules/businesses-app/orders/validations/order-conversion.validations.js";
import { createSaleSchema } from "../../modules/businesses-app/sales/validations/sales.validations.js";
import { createSaleService, createSaleWithinTransaction } from "../../modules/businesses-app/sales/services/sales.service.js";
import { convertOrderController } from "../../modules/businesses-app/orders/controllers/orders.controller.js";
import ordersRouter from "../../modules/businesses-app/orders/routes/orders.routes.js";
import type { OrderDbRow, OrderDetailDbRow } from "../../modules/businesses-app/orders/types/index.js";
import type { PoolConnection } from "mysql2/promise";

const actor = { idBusiness: 7, idUser: 4 };
const key = "00000000-0000-4000-8000-000000000001";
const body = { idCashSession: 10, payments: [{ idPaymentMethod: 8, amount: 9, status: "CONFIRMED" as const }] };
let order: OrderDbRow;
let details: OrderDetailDbRow[];
let sales: { idSale: number; idOrder: number | null; idempotency_key: string }[];
let saleStatus: "COMPLETED" | "CANCELLED";
let failure: string | null;
function sets(...rows: unknown[][]) { return [rows]; }
function calls(name: string) { return mocks.query.mock.calls.filter(function match(call) { return String(call[0]).includes(name); }); }
function convert(input: unknown = body, requestKey = key) { return convertOrderToSaleService(actor, 9, input, requestKey); }
function direct() { return createSaleSchema.parse({ ...actor, idCustomer: 3, idDeposit: 2, idCashSession: 10, idempotencyKey: key, subtotal: 10, discountTotal: 1, total: 9, payments: body.payments, items: [{ idProduct: 5, quantity: 2, unitPrice: 5, discount: 1, total: 9 }] }); }
function response() { const res = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); res.json.mockReturnValue(res); return res; }
beforeEach(function reset() {
  vi.resetAllMocks(); failure = null; sales = []; saleStatus = "COMPLETED";
  order = { idOrder: 9, ...actor, idCustomer: 3, idDeposit: 2, expected_payment_method_id: 88, order_number: "PED-test", status: "READY", fulfillment_type: "PICKUP", customer_snapshot: { fullName: "Ana historica" }, subtotal: "10", discount_total: "1", delivery_fee: "0", total: "9", observation: null } as unknown as OrderDbRow;
  details = [{ idOrderDetail: 1, idOrder: 9, idProduct: 5, product_name: "Historico", barcode: "001", unit_type: "UNIT", sale_mode: "ON_ORDER", quantity: "2", unit_price: "5", discount: "1", total: "9" } as OrderDetailDbRow];
  mocks.getConnection.mockResolvedValue({ query: mocks.query, beginTransaction: mocks.begin, commit: mocks.commit, rollback: mocks.rollback, release: mocks.release });
  mocks.poolQuery.mockImplementation(async function read(sql: string) {
    if (sql.includes("sp_get_sale_by_id")) return sets([{ idSale: 20, idOrder: sales[0]?.idOrder ?? null, sale_number: "VEN-test", delivery_fee: order.delivery_fee, subtotal: 10, discount_total: 1, total: order.total, status: saleStatus }], [], [], []);
    return [[]];
  });
  mocks.query.mockImplementation(async function db(sql: string, args: unknown[]) {
    if (failure && sql.includes(failure)) throw { sqlMessage: failure === "sp_create_sale_detail" ? "Stock insuficiente para procesar la venta" : "CASH_SESSION_CLOSED" };
    if (sql.includes("sp_order_lock")) return sets([order]);
    if (sql.startsWith("SELECT bu.idUser")) return [[{ idUser: 4 }]];
    if (sql.startsWith("SELECT idSale, idOrder")) return [sales];
    if (sql.includes("sp_order_get")) return sets([order], details, sales.map(function link(sale) { return { ...sale, sale_number: "VEN-test", status: saleStatus }; }));
    if (sql.includes("sp_create_sale(")) { sales.push({ idSale: 20, idOrder: args[11] as number | null, idempotency_key: args[3] as string }); return sets([{ idSale: 20, alreadyProcessed: 0 }]); }
    if (sql.includes("sp_order_complete")) order.status = "COMPLETED";
    return sets([]);
  });
});

describe("F5 conversion DB-free", function suite() {
  it.each(["PENDING", "CONFIRMED", "PREPARING", "CANCELLED"] as const)("rechaza %s sin escrituras", async function state(status) {
    order.status = status; await expect(convert()).rejects.toMatchObject({ code: "ORDER_NOT_READY" });
    expect(mocks.rollback).toHaveBeenCalledOnce(); expect(calls("sp_create_sale(")).toHaveLength(0);
  });
  it("READY PICKUP usa datos bloqueados y confirma despues de completar/evento", async function pickup() {
    const result = await convert();
    expect(result).toMatchObject({ idempotentReplay: false, order: { status: "COMPLETED", linkedSale: { idSale: 20, saleNumber: "VEN-test", status: "COMPLETED" } }, sale: { idOrder: 9, deliveryFee: 0 } });
    expect(calls("sp_create_sale(")[0][1]).toEqual([7, 4, expect.any(String), key, 3, 2, 10, 10, 1, 9, null, 9, 0]);
    expect(calls("sp_create_sale_detail")[0][1]).toEqual([7, 4, 20, 5, 2, 2, 5, 1, 9]);
    expect(calls("sp_sale_payment_create")[0][1]).toEqual([7, 20, 8, 9, "CONFIRMED", 4, 10, null, null]);
    expect(calls("sp_delivery_create")).toHaveLength(0);
    expect(calls("sp_order_add_event")[0][1]).toEqual([7, 9, 4, "STATUS_CHANGED", "READY", "COMPLETED", null]);
    const completeIndex = mocks.query.mock.calls.findIndex(function complete(call) { return String(call[0]).includes("sp_order_add_event"); });
    expect(mocks.query.mock.invocationCallOrder[completeIndex]).toBeLessThan(mocks.commit.mock.invocationCallOrder[0]);
    expect(mocks.release.mock.invocationCallOrder[0]).toBeLessThan(mocks.notify.mock.invocationCallOrder[0]);
  });
  it("DELIVERY preserva fee y destinatario del Order, metadata del request", async function delivery() {
    Object.assign(order, { fulfillment_type: "DELIVERY", delivery_fee: "4", total: "13", delivery_recipient_name: "Ana entrega", delivery_recipient_phone: "00123", delivery_address: "Calle 123", delivery_reference: "Porton" });
    const result = await convert({ ...body, payments: [{ ...body.payments[0], amount: 13, status: "PENDING" }], delivery: { assignedToUserId: 12, scheduledAt: "2026-11-01T12:00:00Z", observation: "Avisar" } });
    expect(result.sale.deliveryFee).toBe(4);
    expect(calls("sp_create_sale(")[0][1].slice(7)).toEqual([10, 1, 13, null, 9, 4]);
    expect(calls("sp_delivery_create")[0][1]).toEqual([7, 20, 4, 12, "Ana entrega", "00123", "Calle 123", "Porton", expect.any(Date), "Avisar", "INTERNAL", null, null, null, null, null]);
    expect(calls("sp_sale_payment_create")[0][1][6]).toBeNull();
  });
  it("observacion larga queda en Order sin truncarse", async function note() {
    order.observation = "x".repeat(500); await convert(); expect(calls("sp_create_sale(")[0][1][10]).toBeNull(); expect(order.observation).toHaveLength(500);
  });
  it("limite de observacion Sales tambien conserva texto Unicode largo solo en Order", async function unicode() {
    order.observation = "😀".repeat(130); await convert(); expect(calls("sp_create_sale(")[0][1][10]).toBeNull(); expect(order.observation).toBe("😀".repeat(130));
  });
  it("Order ajeno/inexistente y actor inactivo no escriben", async function tenant() {
    mocks.query.mockResolvedValueOnce(sets([])); await expect(convert()).rejects.toMatchObject({ code: "ORDER_NOT_FOUND" });
    mocks.query.mockResolvedValueOnce(sets([order])).mockResolvedValueOnce([[]]); await expect(convert()).rejects.toMatchObject({ code: "ORDER_ACTOR_INVALID" });
    expect(calls("sp_create_sale(")).toHaveLength(0);
    expect(calls("sp_order_lock")[0][1]).toEqual([7, 9]);
  });
  it("carrera en key de otra venta devuelve conflicto despues de rollback", async function race() {
    const implementation = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async function duplicate(sql: string, args: unknown[]) {
      if (sql.includes("sp_create_sale(")) throw { code: "ER_DUP_ENTRY", sqlMessage: "uq_sales_business_idempotency" };
      return implementation(sql, args);
    });
    await expect(convert()).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_CONFLICT" });
    expect(mocks.rollback).toHaveBeenCalledOnce(); expect(mocks.commit).not.toHaveBeenCalled();
  });
  it("Sales directo acepta deliveryFee aditivo y rechaza total sin incluirlo", function fee() {
    const payload = direct();
    const delivery = { recipientName: "Ana", deliveryAddress: "Calle 123" };
    expect(createSaleSchema.safeParse({ ...payload, delivery, deliveryFee: 4, total: 13, payments: [{ ...body.payments[0], amount: 13 }] }).success).toBe(true);
    expect(createSaleSchema.safeParse({ ...payload, delivery, deliveryFee: 4 }).success).toBe(false);
    expect(createSaleSchema.safeParse({ ...payload, idOrder: 9 }).success).toBe(false);
  });
  it("destinatario o referencia incompatibles con Sales no se recortan", async function limits() {
    Object.assign(order, { fulfillment_type: "DELIVERY", delivery_recipient_name: "x".repeat(170), delivery_recipient_phone: "1", delivery_address: "Calle 123", delivery_reference: "x".repeat(300) });
    await expect(convert()).rejects.toBeDefined(); expect(calls("sp_create_sale(")).toHaveLength(0); expect(order.status).toBe("READY");
  });
  it.each(["idBusiness", "idUser", "idCustomer", "idDeposit", "items", "subtotal", "discountTotal", "deliveryFee", "total", "recipientName", "recipientPhone", "deliveryAddress", "deliveryReference"])("rechaza override %s", async function strict(field) {
    await expect(convert({ ...body, [field]: 99 })).rejects.toBeDefined(); expect(mocks.getConnection).not.toHaveBeenCalled();
  });
  it("metadata delivery estricta y key obligatoria", async function strict() {
    expect(orderConversionSchema.safeParse({ ...body, delivery: { recipientName: "Inject" } }).success).toBe(false);
    await expect(convert(body, "invalid")).rejects.toBeDefined(); expect(mocks.getConnection).not.toHaveBeenCalled();
  });
  it.each([[], new Array(6).fill(body.payments[0]), [{ ...body.payments[0], amount: 0 }]])("valida 1..5 pagos positivos", async function payments(payments) {
    await expect(convert({ ...body, payments })).rejects.toBeDefined(); expect(mocks.getConnection).not.toHaveBeenCalled();
  });
  it.each([{ payments: [{ ...body.payments[0], amount: 8 }] }, { payments: [{ ...body.payments[0], status: "PENDING" }] }, { delivery: {} }])("reglas de total/pending/retiro", async function invalid(patch) {
    await expect(convert({ ...body, ...patch })).rejects.toBeDefined(); expect(mocks.rollback).toHaveBeenCalled(); expect(calls("sp_create_sale(")).toHaveLength(0);
  });
  it("rechaza precio cero aunque Order lo permite", async function incompatible() {
    details[0].unit_price = "0"; await expect(convert()).rejects.toBeDefined(); expect(calls("sp_create_sale(")).toHaveLength(0); expect(order.status).toBe("READY");
  });
  it.each(["sp_create_sale(", "sp_create_sale_detail", "sp_sale_payment_create", "sp_order_complete", "sp_order_add_event"])("error %s revierte sin commit ni notificaciones", async function rollback(stage) {
    failure = stage; await expect(convert()).rejects.toBeDefined(); expect(mocks.rollback).toHaveBeenCalledOnce(); expect(mocks.commit).not.toHaveBeenCalled(); expect(mocks.notify).not.toHaveBeenCalled(); expect(mocks.release).toHaveBeenCalledOnce();
  });
  it("COMPLETED sin venta y READY con venta son conflictos", async function inconsistent() {
    order.status = "COMPLETED"; await expect(convert()).rejects.toMatchObject({ code: "ORDER_SALE_INCONSISTENT" });
    order.status = "READY"; sales = [{ idSale: 20, idOrder: 9, idempotency_key: key }]; await expect(convert()).rejects.toMatchObject({ code: "ORDER_SALE_INCONSISTENT" });
  });
  it.each([null, 100])("key de POS/otro Order %s no se convierte en replay", async function collision(idOrder) {
    sales = [{ idSale: 20, idOrder, idempotency_key: key }]; await expect(convert()).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_CONFLICT" }); expect(calls("sp_create_sale(")).toHaveLength(0);
  });
  it("colision de UUID con otra capitalizacion tampoco autoriza replay de COMPLETED", async function caseInsensitive() {
    order.status = "COMPLETED";
    const upperKey = "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA";
    sales = [{ idSale: 20, idOrder: 9, idempotency_key: key }, { idSale: 21, idOrder: null, idempotency_key: upperKey.toLowerCase() }];
    await expect(convert(body, upperKey)).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_CONFLICT" });
  });
  it("retry keys iguales/distintas y venta cancelada devuelven mismo vinculo", async function retry() {
    await convert(); const before = calls("sp_create_sale_detail").length;
    saleStatus = "CANCELLED";
    for (const requestKey of [key, "00000000-0000-4000-8000-000000000002"]) {
      const replay = await convert(body, requestKey); expect(replay.idempotentReplay).toBe(true); expect(replay.sale.idSale).toBe(20); expect(replay.order.status).toBe("COMPLETED"); expect(replay.order.linkedSale?.status).toBe("CANCELLED");
    }
    expect(calls("sp_create_sale_detail")).toHaveLength(before); expect(calls("sp_order_add_event")).toHaveLength(1);
  });
  it("Direct Sales sin fee sigue en 0 y helper no posee transaccion", async function compatibility() {
    const payload = direct(); expect(payload.deliveryFee).toBe(0);
    const connection = await mocks.getConnection() as PoolConnection;
    await createSaleWithinTransaction(connection, payload);
    expect(mocks.begin).not.toHaveBeenCalled(); expect(mocks.commit).not.toHaveBeenCalled(); expect(mocks.rollback).not.toHaveBeenCalled(); expect(mocks.release).not.toHaveBeenCalled();
    expect(calls("sp_create_sale(")[0][1].slice(11)).toEqual([null, 0]);
    vi.clearAllMocks(); await createSaleService(payload); expect(mocks.begin).toHaveBeenCalledOnce(); expect(mocks.commit).toHaveBeenCalledOnce(); expect(mocks.release).toHaveBeenCalledOnce();
  });
  it("middleware exige ambos permisos y SELLER no pasa convert", async function permissions() {
    const router = ordersRouter as unknown as { stack: { route: { path: string; stack: { handle: RequestHandler }[] } }[] };
    const route = router.stack.find(function route(layer) { return layer.route.path === "/orders/:id/convert-to-sale"; })!.route;
    for (const [index, permission] of ["orders.convert", "sales.create"].entries()) {
      mocks.poolQuery.mockResolvedValueOnce([[{ role: "SELLER" }]]).mockResolvedValueOnce(sets([]));
      const res = response(), next = vi.fn();
      await route.stack[index].handle({ user: { ...actor, role: "SELLER" }, auth: { ...actor, context: "BUSINESS", businessRole: "SELLER" } } as Request, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled(); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { requiredPermission: permission } }));
    }
  });
  it("controller nuevo 201, replay 200, errores caja/stock seguros", async function http() {
    const req = { user: { ...actor, role: "OWNER" }, params: { id: "9" }, body, headers: { "idempotency-key": key } } as unknown as Request;
    const first = response(); await convertOrderController(req, first as unknown as Response); expect(first.status).toHaveBeenCalledWith(201);
    const replay = response(); await convertOrderController(req, replay as unknown as Response); expect(replay.status).toHaveBeenCalledWith(200);
    sales = []; order.status = "READY"; failure = "sp_create_sale_detail";
    const fail = response(); await convertOrderController(req, fail as unknown as Response); expect(fail.status).toHaveBeenCalledWith(409);
  });
  it("SQL/DDL protegen tenant, concurrencia y estado; cancel no reabre Order", function sql() {
    const orders = readFileSync("src/db/procedures/orders.sql", "utf8"), sale = readFileSync("src/db/procedures/sales.sql", "utf8");
    expect(orders).toContain("idBusiness = p_business AND idOrder = p_order FOR UPDATE");
    expect(orders).toContain("idOrder = p_order AND idSale = p_sale AND status = 'COMPLETED'");
    expect(orders.split("CREATE PROCEDURE sp_order_change_status")[1].split("DROP PROCEDURE")[0]).not.toContain("p_to = 'COMPLETED'");
    expect(sale.split("CREATE PROCEDURE sp_cancel_sale_and_revert_stock")[1].split("END$$")[0]).not.toMatch(/UPDATE orders/);
    expect(sale.split("DROP PROCEDURE IF EXISTS sp_cancel_sale_and_revert_stock")[0]).not.toMatch(/START TRANSACTION|COMMIT|ROLLBACK/);
    expect(sale).toContain("NOT (v_existingOrder <=> p_idOrder)");
    const allSql = sale + orders + readFileSync("src/db/procedures/sale_payments.sql", "utf8") + readFileSync("src/db/procedures/deliveries.sql", "utf8");
    for (const file of ["sales/services/sales.service.ts", "orders/services/order-conversion.service.ts"]) {
      const source = readFileSync("src/modules/businesses-app/" + file, "utf8");
      for (const call of source.matchAll(/CALL (sp_\w+)\(([^)]*)\)/g)) {
        const params = allSql.split("CREATE PROCEDURE " + call[1] + "(")[1]?.split(/\)\s*BEGIN/)[0];
        expect(params, call[1]).toBeDefined();
        expect((params.match(/\bIN p_/g) ?? []).length, call[1]).toBe((call[2].match(/\?/g) ?? []).length);
      }
    }
    const migration = readFileSync("src/db/manual/004_order_to_sale.sql", "utf8");
    expect(migration).toContain("UNIQUE KEY uq_sales_business_order (idBusiness, idOrder)");
    expect(migration).toContain("FOREIGN KEY (idBusiness, idOrder) REFERENCES orders (idBusiness, idOrder)");
    expect(migration.replace(/^--.*$/gm, "")).not.toMatch(/DELETE FROM|TRUNCATE|FOREIGN_KEY_CHECKS|orders ADD.*idSale/i);
    expect(migration).toContain("SELECT 'ADMIN', idPermission"); expect(migration).not.toContain("SELECT 'SELLER'");
  });
});
