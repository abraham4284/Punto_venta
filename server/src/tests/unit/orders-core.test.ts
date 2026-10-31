import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { Request, Response, RequestHandler } from "express";
import { orderBodySchema, orderCancelSchema, orderFiltersSchema, orderStatusSchema } from "../../modules/businesses-app/orders/validations/orders.validations.js";
import { assertOrderCancellable, assertOrderEditable, assertOrderQuantity, assertOrderTransition, calculateOrderTotals } from "../../modules/businesses-app/orders/helpers/orders.helper.js";
import { mapOrder, mapOrderDetail, mapOrderEvent, mapOrderProduct } from "../../modules/businesses-app/orders/helpers/orders.mapper.js";
import type { OrderBody, OrderDbRow, OrderDetailDbRow, OrderStatus } from "../../modules/businesses-app/orders/types/index.js";

const mocks = vi.hoisted(function setup() {
  return { poolQuery: vi.fn(), query: vi.fn(), begin: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(), getConnection: vi.fn() };
});
vi.mock("@/db/db.js", function database() {
  return { pool: { query: mocks.poolQuery, getConnection: mocks.getConnection } };
});
import { changeOrderService, getOrderService, listOrdersService, orderEventsService, orderProductsService, saveOrderService } from "../../modules/businesses-app/orders/services/orders.service.js";
import { createOrderController, listOrdersController, orderStatusController } from "../../modules/businesses-app/orders/controllers/orders.controller.js";
import ordersRouter from "../../modules/businesses-app/orders/routes/orders.routes.js";

const actor = { idBusiness: 7, idUser: 4 };
const key = "00000000-0000-4000-8000-000000000001";
const body: OrderBody = { idCustomer: 3, idDeposit: 2, expectedPaymentMethodId: null, fulfillmentType: "PICKUP",
  deliveryFee: 0, subtotal: 10, discountTotal: 1, total: 9,
  items: [{ idProduct: 5, quantity: 2, unitPrice: 5, discount: 1, total: 9 }] };
let row: OrderDbRow;
const detail = { idOrderDetail: 1, idOrder: 9, idProduct: 5, product_name: "Arroz", barcode: "001",
  unit_type: "UNIT", sale_mode: "ON_ORDER", quantity: "2.00", unit_price: "5.00", discount: "1.00", total: "9.00" } as OrderDetailDbRow;

function response() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res); res.json.mockReturnValue(res);
  return res;
}
function req(overrides: Partial<Request> = {}): Request {
  return { user: { ...actor, role: "OWNER" }, body, headers: { "idempotency-key": key }, params: { id: "9" }, query: {}, ...overrides } as Request;
}
function sets(...rows: unknown[][]) { return [rows]; }
function calls(name: string) { return mocks.query.mock.calls.filter(function matches(call) { return String(call[0]).includes(name); }); }

beforeEach(function reset() {
  vi.resetAllMocks();
  row = { idOrder: 9, idBusiness: 7, idCustomer: 3, idDeposit: 2, expected_payment_method_id: null,
    order_number: "PED-test", status: "PENDING", fulfillment_type: "PICKUP",
    customer_snapshot: JSON.stringify({ fullName: "Ana Perez", documentType: "DNI", documentNumber: "001", phone: null, email: null, address: null }),
    delivery_recipient_name: null, delivery_recipient_phone: null, delivery_address: null, delivery_reference: null,
    subtotal: "10.00", discount_total: "1.00", delivery_fee: "0.00", total: "9.00", observation: null, cancellation_reason: null,
    created_by_user_id: 4, updated_by_user_id: 4, created_at: new Date(), updated_at: new Date() } as OrderDbRow;
  mocks.getConnection.mockResolvedValue({ query: mocks.query, beginTransaction: mocks.begin, commit: mocks.commit, rollback: mocks.rollback, release: mocks.release });
  mocks.poolQuery.mockResolvedValue([[]]);
  mocks.query.mockImplementation(async function database(sql: string, params: unknown[]) {
    if (sql.includes("sp_order_lock")) return sets([row]);
    if (sql.includes("sp_order_get")) return sets([row], [detail]);
    if (sql.startsWith("SELECT bu.idUser")) return [[{ idUser: 4 }]];
    if (sql.startsWith("SELECT first_name")) return [[{ first_name: "Ana", last_name: "Perez", document_type: "DNI", document_number: "001", phone: null, email: null, address: null }]];
    if (sql.startsWith("SELECT idDeposit")) return [[{ idDeposit: 2 }]];
    if (sql.startsWith("SELECT idPaymentMethod")) return [[{ idPaymentMethod: 1 }]];
    if (sql.startsWith("SELECT idProduct")) return [[{ idProduct: 5, name: "Arroz", barcode: "001", unit_type: "UNIT", sale_mode: "ON_ORDER", price_sale: "5.00" }]];
    if (sql.includes("sp_order_create")) return sets([{ idOrder: 9 }]);
    if (sql.includes("sp_order_change_status")) row.status = params[4] as OrderStatus;
    return sets([]);
  });
});

describe("Orders domain", function domain() {
  it.each<[OrderStatus, OrderStatus]>([["PENDING", "CONFIRMED"], ["CONFIRMED", "PREPARING"], ["PREPARING", "READY"]])("permite %s -> %s", function transition(from, to) {
    expect(function run() { assertOrderTransition(from, to); }).not.toThrow();
  });
  it.each<OrderStatus>(["PENDING", "CONFIRMED", "PREPARING", "READY", "CANCELLED", "COMPLETED"])("bloquea COMPLETED desde %s", function completed(from) {
    expect(function run() { assertOrderTransition(from, "COMPLETED"); }).toThrow();
  });
  it.each<[OrderStatus, OrderStatus]>([["PENDING", "READY"], ["READY", "CONFIRMED"], ["COMPLETED", "READY"], ["CANCELLED", "CONFIRMED"], ["CONFIRMED", "CONFIRMED"]])("rechaza %s -> %s", function reject(from, to) {
    expect(function run() { assertOrderTransition(from, to); }).toThrow();
  });
  it.each<OrderStatus>(["PENDING", "CONFIRMED", "PREPARING", "READY"])("cancela %s", function cancel(status) {
    expect(function run() { assertOrderCancellable(status); }).not.toThrow();
  });
  it.each<OrderStatus>(["CANCELLED", "COMPLETED"])("protege terminal %s", function terminal(status) {
    expect(function run() { assertOrderCancellable(status); }).toThrow();
    expect(function run() { assertOrderEditable(status); }).toThrow();
  });
  it.each<OrderStatus>(["PREPARING", "READY"])("no edita %s", function edit(status) {
    expect(function run() { assertOrderEditable(status); }).toThrow();
  });
  it.each<OrderStatus>(["PENDING", "CONFIRMED"])("edita %s", function edit(status) {
    expect(function run() { assertOrderEditable(status); }).not.toThrow();
  });
  it("usa Decimal y redondeo half-up por linea", function math() {
    const items = [{ idProduct: 1, quantity: 0.15, unitPrice: 0.3, discount: 0.01, total: 0.04 }];
    expect(calculateOrderTotals(items, 0.1)).toEqual({ subtotal: 0.05, discountTotal: 0.01, total: 0.14, lineTotals: [0.04] });
    expect(function run() { assertOrderQuantity("UNIT", 0.5); }).toThrow();
    expect(function run() { assertOrderQuantity("KG", 0.5); }).not.toThrow();
  });
  it("valida aritmetica completa y duplicados", function validation() {
    expect(orderBodySchema.safeParse(body).success).toBe(true);
    expect(orderBodySchema.safeParse({ ...body, total: 8 }).success).toBe(false);
    expect(orderBodySchema.safeParse({ ...body, items: [...body.items, ...body.items], subtotal: 20, discountTotal: 2, total: 18 }).success).toBe(false);
    expect(orderBodySchema.safeParse({ ...body, items: [{ ...body.items[0], discount: 11 }] }).success).toBe(false);
    expect(orderBodySchema.safeParse({ ...body, items: [{ ...body.items[0], quantity: 0.001 }] }).success).toBe(false);
  });
  it("PICKUP no admite entrega y DELIVERY requiere datos", function fulfillment() {
    const delivery = { recipientName: "Ana", recipientPhone: "001", address: "Calle 123" };
    expect(orderBodySchema.safeParse({ ...body, delivery }).success).toBe(false);
    expect(orderBodySchema.safeParse({ ...body, deliveryFee: 1, total: 10 }).success).toBe(false);
    expect(orderBodySchema.safeParse({ ...body, fulfillmentType: "DELIVERY" }).success).toBe(false);
    expect(orderBodySchema.safeParse({ ...body, fulfillmentType: "DELIVERY", delivery, deliveryFee: 2, total: 11 }).success).toBe(true);
    expect(orderBodySchema.safeParse({ ...body, fulfillmentType: "DELIVERY", delivery: { ...delivery, recipientPhone: "" } }).success).toBe(false);
  });
  it("rechaza campos no autorizados y entradas vacias", function strict() {
    for (const extra of [{ status: "COMPLETED" }, { customerSnapshot: {} }, { idBusiness: 88 }, { idUser: 99 }]) {
      expect(orderBodySchema.safeParse({ ...body, ...extra }).success).toBe(false);
    }
    expect(orderBodySchema.safeParse({ ...body, items: [] }).success).toBe(false);
    expect(orderCancelSchema.safeParse({ reason: "  " }).success).toBe(false);
    expect(orderStatusSchema.safeParse({ status: "COMPLETED" }).success).toBe(false);
    expect(orderStatusSchema.safeParse({ status: "CANCELLED" }).success).toBe(false);
    expect(orderFiltersSchema.safeParse({ dateFrom: "2026-12-01", dateTo: "2026-01-01" }).success).toBe(false);
    expect(orderFiltersSchema.safeParse({ limit: 1000 }).success).toBe(false);
  });
});

describe("Orders services without DB", function services() {
  it("crea con snapshots DB, evento y una transaccion; ON_ORDER y stock inexistente no bloquean", async function create() {
    const result = await saveOrderService(actor, body, key);
    expect(result.idempotentReplay).toBe(false);
    expect(calls("sp_order_create")[0][1][6]).toContain('"fullName":"Ana Perez"');
    expect(calls("sp_order_add_detail")[0][1].slice(3, 7)).toEqual(["Arroz", "001", "UNIT", "ON_ORDER"]);
    expect(calls("sp_order_add_event")[0][1]).toEqual([7, 9, 4, "CREATED", null, "PENDING", null]);
    expect(mocks.begin).toHaveBeenCalledTimes(2); // write + consistent detail read
    expect(mocks.release).toHaveBeenCalledTimes(2);
    expect(mocks.rollback).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.some(function sql(call) { return /\b(stock|sales|sale_payments|cash_movements)\b/i.test(call[0]); })).toBe(false);
  });
  it("replay evita detalles/eventos/snapshots nuevos", async function replay() {
    mocks.poolQuery.mockResolvedValueOnce([[{ idOrder: 9 }]]);
    expect((await saveOrderService(actor, body, key)).idempotentReplay).toBe(true);
    expect(calls("sp_order_create")).toHaveLength(0);
    expect(calls("sp_order_add_event")).toHaveLength(0);
    expect(calls("SELECT first_name")).toHaveLength(0);
  });
  it("carrera UNIQUE revierte y libera antes de recuperar replay", async function race() {
    mocks.poolQuery.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ idOrder: 9 }]]);
    const impl = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async function racing(sql: string, args: unknown[]) {
      if (sql.includes("sp_order_create")) throw { code: "ER_DUP_ENTRY", sqlMessage: "Duplicate uq_orders_business_idempotency" };
      return impl(sql, args);
    });
    const result = await saveOrderService(actor, body, key);
    expect(result.idempotentReplay).toBe(true);
    expect(mocks.rollback).toHaveBeenCalledTimes(1);
    expect(mocks.release).toHaveBeenCalledTimes(2);
    expect(calls("sp_order_add_detail")).toHaveLength(0);
  });
  it("no trata otra colision UNIQUE como replay", async function numberCollision() {
    const impl = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async function collision(sql: string, args: unknown[]) {
      if (sql.includes("sp_order_create")) throw { code: "ER_DUP_ENTRY", sqlMessage: "uq_orders_business_number" };
      return impl(sql, args);
    });
    await expect(saveOrderService(actor, body, key)).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
    expect(mocks.poolQuery).toHaveBeenCalledTimes(1);
  });
  it.each(["customers", "deposits", "products", "payment_methods", "business_users"])("rechaza referencia ajena/inactiva: %s", async function tenant(table) {
    const impl = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async function absent(sql: string, args: unknown[]) {
      if (sql.includes(`FROM ${table} `)) return [[]];
      return impl(sql, args);
    });
    await expect(saveOrderService(actor, { ...body, expectedPaymentMethodId: 1 }, key)).rejects.toMatchObject({ statusCode: table === "business_users" ? 403 : 400 });
    expect(calls("sp_order_create")).toHaveLength(0);
    expect(mocks.rollback).toHaveBeenCalledTimes(1);
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });
  it("todas las lecturas de referencia usan tenant y locks", async function tenant() {
    await saveOrderService(actor, { ...body, expectedPaymentMethodId: 1 }, key);
    const reads = mocks.query.mock.calls.filter(function select(call) { return call[0].startsWith("SELECT"); });
    for (const [sql, args] of reads) { expect(sql).toContain("idBusiness = ?"); expect(sql).toContain("FOR UPDATE"); expect(args[0]).toBe(7); }
  });
  it("update bloquea cabecera antes de reemplazar y conserva estado", async function update() {
    row.status = "CONFIRMED";
    await saveOrderService(actor, body, undefined, 9);
    expect(mocks.query.mock.calls[0]).toEqual(["CALL sp_order_lock(?, ?)", [7, 9]]);
    expect(calls("sp_order_update")[0][1].slice(0, 3)).toEqual([9, 7, 4]);
    expect(calls("sp_order_add_event")[0][1].slice(3)).toEqual(["UPDATED", "CONFIRMED", "CONFIRMED", null]);
  });
  it("update contra estado avanzado revierte sin tocar detalles", async function advanced() {
    row.status = "PREPARING";
    await expect(saveOrderService(actor, body, undefined, 9)).rejects.toMatchObject({ statusCode: 409 });
    expect(calls("sp_order_update")).toHaveLength(0);
    expect(mocks.rollback).toHaveBeenCalled();
  });
  it("fallo al insertar evento revierte operacion completa", async function atomic() {
    const impl = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async function fail(sql: string, args: unknown[]) {
      if (sql.includes("sp_order_add_event")) throw new Error("event failure");
      return impl(sql, args);
    });
    await expect(saveOrderService(actor, body, key)).rejects.toThrow("event failure");
    expect(mocks.commit).not.toHaveBeenCalled();
    expect(mocks.rollback).toHaveBeenCalledTimes(1);
  });
  it("status usa estado bloqueado y evento en misma transaccion", async function status() {
    await changeOrderService(actor, 9, { status: "CONFIRMED" }, false);
    expect(calls("sp_order_change_status")[0][1]).toEqual([7, 9, 4, "PENDING", "CONFIRMED", null]);
    expect(calls("sp_order_add_event")).toHaveLength(1);
  });
  it("un segundo cambio a igual estado se valida contra el estado ya avanzado", async function stale() {
    await changeOrderService(actor, 9, { status: "CONFIRMED" }, false);
    await expect(changeOrderService(actor, 9, { status: "CONFIRMED" }, false)).rejects.toMatchObject({ statusCode: 409 });
    expect(calls("sp_order_change_status")).toHaveLength(1);
    expect(calls("sp_order_add_event")).toHaveLength(1);
  });
  it("cancel desde READY requiere motivo y no genera efectos economicos", async function cancel() {
    row.status = "READY";
    await changeOrderService(actor, 9, { reason: "Cliente cancela" }, true);
    expect(calls("sp_order_change_status")[0][1]).toEqual([7, 9, 4, "READY", "CANCELLED", "Cliente cancela"]);
    row.status = "CANCELLED";
    await expect(changeOrderService(actor, 9, { status: "CONFIRMED" }, false)).rejects.toMatchObject({ statusCode: 409 });
  });
  it("no asigna COMPLETED ni abre transaccion para payload invalido", async function completed() {
    await expect(changeOrderService(actor, 9, { status: "COMPLETED" }, false)).rejects.toThrow();
    expect(mocks.begin).not.toHaveBeenCalled();
  });
  it("detail ajeno devuelve 404 y suelta conexion", async function missing() {
    mocks.query.mockResolvedValueOnce(sets([]));
    await expect(getOrderService(8, 9)).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });
  it("paginacion y metricas se toman del resumen completo", async function list() {
    mocks.poolQuery.mockResolvedValueOnce(sets([row], [{ totalRecords: 41, totalAmount: "123.45", ready: 20 }]));
    const result = await listOrdersService(7, orderFiltersSchema.parse({ page: 2, limit: 20, status: "READY" }));
    expect(result.pagination).toEqual({ totalRecords: 41, currentPage: 2, totalPages: 3, limit: 20 });
    expect(result.metrics.totalAmount).toBe(123.45);
    expect(mocks.poolQuery.mock.calls[0][1]).toEqual([7, "READY", null, null, null, null, null, null, 20, 20]);
  });
  it("productos incluye stock cero y ON_ORDER y eventos siempre reciben tenant", async function reads() {
    mocks.poolQuery.mockResolvedValueOnce(sets([{ idProduct: 5, name: "Arroz", barcode: null, unit_type: "UNIT", sale_mode: "ON_ORDER", price_sale: "5", stock_quantity: "0" }], [{ totalRecords: 1 }]));
    const result = await orderProductsService(7, 2, { page: 1, limit: 20 });
    expect(result.items[0]).toMatchObject({ stockQuantity: 0, saleMode: "on_order" });
    mocks.poolQuery.mockResolvedValueOnce(sets([]));
    await orderEventsService(7, 9);
    expect(mocks.poolQuery.mock.lastCall?.[1]).toEqual([7, 9]);
  });
});

describe("HTTP and mapping contracts", function contracts() {
  it.each([
    ["post", "/orders", "orders.create"], ["get", "/orders", "orders.view"],
    ["get", "/orders/products-by-deposit/:idDeposit", "orders.view"],
    ["get", "/orders/:id", "orders.view"], ["get", "/orders/:id/events", "orders.view"],
    ["put", "/orders/:id", "orders.update"], ["patch", "/orders/:id/status", "orders.change_status"],
    ["patch", "/orders/:id/cancel", "orders.cancel"],
  ])("%s %s exige %s antes del controller", async function permission(method, path, code) {
    const router = ordersRouter as unknown as { stack: { route: { path: string; methods: Record<string, boolean>; stack: { handle: RequestHandler }[] } }[] };
    const layer = router.stack.find(function match(layer) { return layer.route.path === path && layer.route.methods[method]; });
    expect(layer).toBeDefined();
    mocks.poolQuery.mockResolvedValueOnce([[{ role: "SELLER" }]]).mockResolvedValueOnce(sets([]));
    const res = response(); const next = vi.fn();
    await layer!.route.stack[0].handle(req({ auth: { context: "BUSINESS", ...actor, businessRole: "SELLER" }, user: { ...actor, role: "SELLER" } }), res as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { requiredPermission: code } }));
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });
  it("controller toma tenant/actor de req.user", async function source() {
    const res = response();
    await createOrderController(req(), res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(calls("sp_order_create")[0][1].slice(0, 2)).toEqual([7, 4]);
    expect(mocks.poolQuery.mock.calls[0][1]).toEqual([7, key]);
  });
  it("rechaza tenant/actor/snapshot inyectados por body", async function spoof() {
    const res = response();
    await createOrderController(req({ body: { ...body, idBusiness: 99, idUser: 100, customerSnapshot: {} } }), res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });
  it("controller replay es 200, falta key 400 y COMPLETED 400", async function http() {
    mocks.poolQuery.mockResolvedValueOnce([[{ idOrder: 9 }]]);
    const replay = response(); await createOrderController(req(), replay as unknown as Response);
    expect(replay.status).toHaveBeenCalledWith(200);
    const noKey = response(); await createOrderController(req({ headers: {} }), noKey as unknown as Response);
    expect(noKey.status).toHaveBeenCalledWith(400);
    const terminal = response(); await orderStatusController(req({ body: { status: "COMPLETED" } }), terminal as unknown as Response);
    expect(terminal.status).toHaveBeenCalledWith(400);
  });
  it("errores inesperados no exponen SQL", async function errors() {
    mocks.poolQuery.mockRejectedValueOnce(new Error("password sql schema secret"));
    const res = response(); await listOrdersController(req(), res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("secret");
  });
  it("mappers exponen camelCase, snapshots y numeros sin clave interna", function mapper() {
    expect(mapOrder(row)).toMatchObject({ idOrder: 9, total: 9, customerSnapshot: { fullName: "Ana Perez", documentNumber: "001" } });
    expect(mapOrderDetail(detail)).toMatchObject({ productName: "Arroz", saleMode: "on_order", unitPrice: 5 });
    expect(mapOrder(row)).not.toHaveProperty("idempotency_key");
    expect(mapOrderEvent({ idOrderEvent: 1, idOrder: 9, event_type: "CREATED", from_status: null, to_status: "PENDING", idUser: 4, reason: null, created_at: row.created_at } as never)).toMatchObject({ eventType: "CREATED", idUser: 4 });
    expect(mapOrderProduct({ idProduct: 1, name: "A", barcode: "001", unit_type: "KG", sale_mode: "STOCK", price_sale: "1.25", stock_quantity: "0" } as never)).toMatchObject({ priceSale: 1.25, stockQuantity: 0 });
  });
});

describe("SQL invariants (static, not execution)", function sql() {
  it("read/write procedures have no economic writes and SQL state guard blocks COMPLETED", function effects() {
    const source = readFileSync("src/db/procedures/orders.sql", "utf8");
    expect(source).not.toMatch(/(?:INSERT INTO|UPDATE|DELETE FROM)\s+(?:stock|stock_movements|sales|sale_payments|cash_\w+|sale_deliveries)\b/i);
    expect(source).not.toMatch(/START TRANSACTION|\bCOMMIT\b|\bROLLBACK\b/);
    const status = source.split("CREATE PROCEDURE sp_order_change_status")[1].split("DROP PROCEDURE")[0];
    expect(status).toContain("FOR UPDATE");
    expect(status).not.toContain("p_to = 'COMPLETED'");
    const products = source.split("CREATE PROCEDURE sp_order_products")[1];
    expect(products).toContain("LEFT JOIN stock"); expect(products).not.toMatch(/quantity\s*>\s*0/);
  });
  it("migracion replica bloques canonicos F3 sin cambios ajenos ni reset de permisos", function migration() {
    const migration = readFileSync("src/db/manual/003_orders_core.sql", "utf8");
    for (const file of ["002_create_tables", "003_add_indexes", "004_add_foreign_keys", "005_add_constraints"]) {
      const canonical = readFileSync(`src/db/schema/${file}.sql`, "utf8").replaceAll("\r", "");
      const block = canonical.split("-- Orders Core F3")[1].split("-- End Orders Core F3")[0];
      expect(migration.replaceAll("\r", "")).toContain(block);
    }
    expect(migration).not.toMatch(/DELETE FROM role_permissions|TRUNCATE|FOREIGN_KEY_CHECKS|SOURCE\s+\w/i);
    expect(migration).toContain("uq_orders_business_idempotency");
  });
  it("row and metric filters match and metric aggregation is not paginated", function filters() {
    const source = readFileSync("src/db/procedures/orders.sql", "utf8");
    const list = source.split("CREATE PROCEDURE sp_order_list")[1].split("DROP PROCEDURE")[0];
    const rowWhere = list.split("WHERE o.idBusiness")[1].split("ORDER BY")[0].trim();
    const summaryWhere = list.split("WHERE o.idBusiness")[2].split("END$$")[0].trim().replace(/;$/, "");
    expect(rowWhere).toBe(summaryWhere);
    expect(summaryWhere).not.toContain("LIMIT");
  });
  it("CALLs y firmas SQL mantienen cantidad de parametros, y mount hereda cadena BUSINESS", function signatures() {
    const sql = readFileSync("src/db/procedures/orders.sql", "utf8");
    const service = readFileSync("src/modules/businesses-app/orders/services/orders.service.ts", "utf8");
    for (const match of service.matchAll(/CALL (sp_order_\w+)\(([^)]*)\)/g)) {
      const definition = sql.split(`CREATE PROCEDURE ${match[1]}(`)[1]?.split(/\n?\)\s*\nBEGIN/)[0];
      expect(definition, match[1]).toBeDefined();
      expect((definition.match(/\bIN p_/g) ?? []).length, match[1]).toBe((match[2].match(/\?/g) ?? []).length);
    }
    const mount = readFileSync("src/modules/businesses-app/index.ts", "utf8");
    expect(mount.indexOf("businessesAppRoutes.use(orderRoutes)")).toBeGreaterThan(mount.indexOf("  requireOperationalSubscription,"));
  });
});
