import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { Decimal } from "decimal.js";
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";

const mocks = vi.hoisted(function mockState() {
  return { query: vi.fn(), poolQuery: vi.fn(), begin: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(), getConnection: vi.fn(), notify: vi.fn() };
});
vi.mock("@/db/db.js", function db() { return { pool: { query: mocks.poolQuery, getConnection: mocks.getConnection } }; });
vi.mock("@/modules/notifications/services/notifications.service.js", function notifications() { return { safeEvaluateStockNotification: mocks.notify }; });
vi.mock("@/config/public-catalog.config.js", function config() { return { publicCatalogConfig: { enabled: true, businessSlug: "selected-tenant" } }; });

import { createSaleService, createSaleWithinTransaction } from "@/modules/businesses-app/sales/services/sales.service.js";
import { createSaleSchema } from "@/modules/businesses-app/sales/validations/sales.validations.js";
import { createSaleController } from "@/modules/businesses-app/sales/controllers/sales.controller.js";
import { mapSale } from "@/modules/businesses-app/sales/helpers/sale.mapper.js";
import { mapCustomer } from "@/modules/businesses-app/customers/helpers/customer.mapper.js";
import { createCustomerSchema, updateCustomerSchema } from "@/modules/businesses-app/customers/validations/customers.validations.js";
import { updateBusinessSchema } from "@/modules/businesses-app/businesses/validations/business.validations.js";
import { getBusinessService, updateBusinessService } from "@/modules/businesses-app/businesses/services/business.service.js";
import { mapPublicCatalogProductDetail, mapPublicCatalogProductListItem } from "@/modules/storefront-app/catalog/helpers/catalog.mapper.js";
import { getPublicCatalogService, getPublicCatalogProductsService } from "@/modules/storefront-app/catalog/services/catalog.service.js";
import type { SaleDbRow } from "@/modules/businesses-app/sales/types/index.js";
import type { CustomerDbRow } from "@/modules/businesses-app/customers/types/index.js";
import type { PublicCatalogProductDbRow } from "@/modules/storefront-app/catalog/types/catalog.types.js";

const key = "00000000-0000-4000-8000-000000000001";
let policy: { wholesale_enabled: number; wholesale_minimum_amount: number | null };
let customer: { pricing_tier: "RETAIL" | "WHOLESALE"; is_active: number } | null;
let product: { price_wholesale: number | null; unit_type: string } | null;
let replay: boolean;
let failure: string | null;
function payload(quantity = 5, pricingType: "RETAIL" | "WHOLESALE" = "WHOLESALE") {
  const amount = new Decimal(quantity).mul(10000).toDecimalPlaces(2).toNumber();
  return createSaleSchema.parse({ idBusiness: 7, idUser: 4, idCustomer: 3, idDeposit: 2, idCashSession: 10,
    idempotencyKey: key, pricingType, subtotal: amount, discountTotal: 0, total: amount,
    items: [{ idProduct: 5, quantity, unitPrice: 10000, discount: 0, total: amount }],
    payments: [{ idPaymentMethod: 8, amount, status: "CONFIRMED" }],
  });
}
function calls(fragment: string) { return mocks.query.mock.calls.filter(function match(call) { return String(call[0]).includes(fragment); }); }
function response() { const res = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); res.json.mockReturnValue(res); return res; }
function publicRow(): PublicCatalogProductDbRow {
  return { idProduct: 5, name: "Public product", slug: "product", description: null, image_url: null,
    price_sale: "15000", price_wholesale: "10000", stock_available: 2, sale_mode: "STOCK", availability_note: null,
    idProductCategory: 1, product_category_slug: "category", product_category_name: "Category",
    price_cost: "PRIVATE", lastPurchaseCost: "PRIVATE", externalCost: "PRIVATE", margin: "PRIVATE" } as unknown as PublicCatalogProductDbRow;
}

beforeEach(function setup() {
  vi.resetAllMocks();
  policy = { wholesale_enabled: 1, wholesale_minimum_amount: 50000 };
  customer = { pricing_tier: "RETAIL", is_active: 1 };
  product = { price_wholesale: 10000, unit_type: "UNIT" }; replay = false; failure = null;
  mocks.getConnection.mockResolvedValue({ query: mocks.query, beginTransaction: mocks.begin, commit: mocks.commit, rollback: mocks.rollback, release: mocks.release });
  mocks.query.mockImplementation(async function query(sql: string) {
    if (failure && sql.includes(failure)) throw new Error("internal database secret");
    if (sql.includes("sp_create_sale(")) return [[[{ idSale: 20, alreadyProcessed: Number(replay) }]]];
    if (sql.includes("FROM businesses")) return [[policy]];
    if (sql.includes("FROM customers")) return [customer ? [customer] : []];
    if (sql.includes("FROM products")) return [product ? [product] : []];
    return [[]];
  });
  mocks.poolQuery.mockImplementation(async function query(sql: string) {
    if (sql.includes("sp_get_sale_by_id")) return [[[{ idSale: 20, pricing_type: "WHOLESALE" }], [], [], []]];
    if (sql.includes("business") || sql.includes("sp_storefront_get_catalog")) return [[[{ ...policy, name: "Tenant", slug: "selected-tenant" }]]];
    if (sql.includes("sp_storefront_get_products")) return [[[publicRow()], [{ totalRecords: 1 }]]];
    return [[]];
  });
});

describe("F10.1 wholesale sales, DB-free", function sales() {
  it("defaults to RETAIL and preserves anonymous/manual prices", async function retail() {
    const data = payload(1, "RETAIL");
    const { pricingType: _type, ...legacy } = data;
    expect(createSaleSchema.parse(legacy).pricingType).toBe("RETAIL");
    await createSaleService({ ...data, idCustomer: null });
    expect(calls("FROM businesses")).toHaveLength(0); expect(calls("UPDATE customers")).toHaveLength(0);
    expect(calls("sp_create_sale_detail")[0][1][6]).toBe(10000);
  });
  it.each(["SALE", "wholesale", null, 1])("rejects invalid pricingType %s", function invalid(pricingType) {
    expect(createSaleSchema.safeParse({ ...payload(), pricingType }).success).toBe(false);
  });
  it.each([4, 5, 6])("initial purchase %s units uses catalog wholesale candidate", async function threshold(q) {
    if (q < 5) {
      await expect(createSaleService(payload(q))).rejects.toMatchObject({ code: "WHOLESALE_MINIMUM_NOT_REACHED" });
      expect(mocks.rollback).toHaveBeenCalledOnce(); expect(mocks.commit).not.toHaveBeenCalled();
      expect(calls("UPDATE customers")).toHaveLength(0);
    } else {
      await createSaleService(payload(q)); expect(mocks.commit).toHaveBeenCalledOnce();
      expect(calls("UPDATE customers")[0][1]).toEqual([7, 3]);
    }
  });
  it("respects configured minimum rather than a fixed amount", async function configured() {
    policy.wholesale_minimum_amount = 10000; await createSaleService(payload(1)); expect(mocks.commit).toHaveBeenCalledOnce();
  });
  it("WHOLESALE customer buys below minimum without overwriting activation date", async function existing() {
    customer!.pricing_tier = "WHOLESALE"; await createSaleService(payload(1));
    expect(calls("UPDATE customers")).toHaveLength(0); expect(calls("UPDATE sales")[0][1]).toEqual([7, 20]);
  });
  it("discounts and delivery do not contribute to initial threshold", async function discounts() {
    const data = payload(5); data.items[0].discount = 5000; data.items[0].total = 45000;
    data.discountTotal = 5000; data.total = 45000; data.payments[0].amount = 45000;
    await createSaleService(createSaleSchema.parse(data)); expect(mocks.commit).toHaveBeenCalledOnce();
    const below = payload(4); below.deliveryFee = 10000; below.total = 50000; below.payments[0].amount = 50000;
    await expect(createSaleService(createSaleSchema.parse(below))).rejects.toMatchObject({ code: "WHOLESALE_MINIMUM_NOT_REACHED" });
  });
  it.each([0, 1])("disabled or invalid policy blocks tier %s", async function disabled(tier) {
    customer!.pricing_tier = tier ? "WHOLESALE" : "RETAIL"; policy.wholesale_enabled = 0;
    await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_DISABLED" });
  });
  it("enabled policy with NULL minimum fails closed", async function invalidPolicy() {
    policy.wholesale_minimum_amount = null; await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_DISABLED" });
  });
  it("requires customer", async function anonymous() {
    await expect(createSaleService({ ...payload(), idCustomer: null })).rejects.toMatchObject({ code: "WHOLESALE_CUSTOMER_REQUIRED" });
    expect(calls("sp_create_sale_detail")).toHaveLength(0);
  });
  it("tenant-mismatched customer cannot be promoted", async function tenant() {
    customer = null; await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_CUSTOMER_NOT_FOUND" });
    expect(calls("FROM customers")[0][1]).toEqual([7, 3]); expect(calls("UPDATE customers")).toHaveLength(0);
  });
  it("inactive customer fails", async function inactive() {
    customer!.is_active = 0; await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_CUSTOMER_INACTIVE" });
  });
  it("maps pre-header SQL customer rejection to a safe wholesale code", async function header() {
    mocks.query.mockRejectedValueOnce({ sqlMessage: "El cliente indicado no pertenece al negocio o esta inactivo" });
    await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_CUSTOMER_INVALID" });
  });
  it.each([null, 0, -1])("missing/invalid wholesale price %s never falls back", async function missing(price) {
    product!.price_wholesale = price; await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_PRICE_MISSING" });
  });
  it("inactive/foreign product cannot supply a price", async function foreignProduct() {
    product = null; await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_PRICE_MISSING" });
    expect(calls("FROM products")[0][1]).toEqual([7, 5]);
  });
  it("client unit price cannot bypass wholesale rule", async function mismatch() {
    product!.price_wholesale = 9000;
    await expect(createSaleService(payload())).rejects.toMatchObject({ code: "WHOLESALE_PRICE_MISMATCH" });
  });
  it.each([["UNIT", 1.1], ["KG", 1.001]])("validates %s quantity %s without DB rounding", async function precision(unit, quantity) {
    product!.unit_type = String(unit);
    await expect(createSaleService(payload(Number(quantity)))).rejects.toMatchObject({ code: "WHOLESALE_INVALID_QUANTITY" });
  });
  it("fractional KG uses Decimal and exact minimum", async function decimal() {
    product!.unit_type = "KG"; policy.wholesale_minimum_amount = 12300;
    await createSaleService(payload(1.23)); expect(mocks.commit).toHaveBeenCalledOnce();
  });
  it("replay skips policy, promotion and all economic writes even after config changes", async function retry() {
    replay = true; policy.wholesale_enabled = 0;
    expect((await createSaleService(payload())).idempotentReplay).toBe(true);
    expect(calls("FROM businesses")).toHaveLength(0); expect(calls("UPDATE customers")).toHaveLength(0);
    expect(calls("sp_create_sale_detail")).toHaveLength(0); expect(mocks.notify).not.toHaveBeenCalled();
  });
  it.each(["UPDATE customers", "sp_create_sale_detail", "sp_sale_payment_create", "sp_delivery_create"])("failure in %s rolls back promotion/header without notification", async function rollback(stage) {
    failure = stage; const data = { ...payload(), delivery: { recipientName: "Cliente", deliveryAddress: "Calle 123" } };
    await expect(createSaleService(data)).rejects.toThrow("internal database secret");
    expect(mocks.rollback).toHaveBeenCalledOnce(); expect(mocks.commit).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled(); expect(mocks.release).toHaveBeenCalledOnce();
  });
  it("shared helper leaves transaction ownership to caller and locks customer before promotion", async function ownership() {
    const connection = await mocks.getConnection() as PoolConnection;
    await createSaleWithinTransaction(connection, payload());
    expect(mocks.begin).not.toHaveBeenCalled(); expect(mocks.commit).not.toHaveBeenCalled(); expect(mocks.release).not.toHaveBeenCalled();
    expect(calls("FROM customers")[0][0]).toContain("FOR UPDATE");
    const lock = mocks.query.mock.calls.findIndex(function find(c) { return String(c[0]).includes("FROM customers"); });
    const write = mocks.query.mock.calls.findIndex(function find(c) { return String(c[0]).includes("UPDATE customers"); });
    expect(lock).toBeLessThan(write);
  });
  it.each([null, "RETAIL", "WHOLESALE"] as const)("reads historical pricingType %s without inference", function history(pricing_type) {
    expect(mapSale({ pricing_type } as SaleDbRow).pricingType).toBe(pricing_type);
  });
  it("controller adds domain code and never leaks SQL engine details", async function http() {
    const req = { user: { idBusiness: 7, idUser: 4 }, body: payload(), headers: { "idempotency-key": key } } as unknown as Request;
    policy.wholesale_enabled = 0; const domain = response();
    await createSaleController(req, domain as unknown as Response);
    expect(domain.status).toHaveBeenCalledWith(400); expect(domain.json).toHaveBeenCalledWith(expect.objectContaining({ code: "WHOLESALE_DISABLED" }));
    failure = "sp_create_sale("; const sql = response(); await createSaleController(req, sql as unknown as Response);
    expect(sql.status).toHaveBeenCalledWith(500); expect(JSON.stringify(sql.json.mock.calls)).not.toContain("secret");
  });
  it("deadlock is a retryable safe conflict", async function deadlock() {
    mocks.query.mockRejectedValueOnce({ code: "ER_LOCK_DEADLOCK", sqlMessage: "secret" }); const res = response();
    await createSaleController({ user: { idBusiness: 7, idUser: 4 }, body: payload(), headers: { "idempotency-key": key } } as unknown as Request, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(409); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "SALE_CONCURRENT_CHANGE" }));
  });
});

describe("F10.1 contracts and SQL invariants, DB-free", function contracts() {
  it.each(["RETAIL", "WHOLESALE"] as const)("Customer %s exposes classification/date", function tier(pricing_tier) {
    const since = pricing_tier === "RETAIL" ? null : new Date("2026-01-01T12:00:00Z");
    expect(mapCustomer({ first_name: "Ana", last_name: "Perez", pricing_tier, wholesale_since: since } as CustomerDbRow))
      .toMatchObject({ pricingTier: pricing_tier, wholesaleSince: since });
  });
  it("Customers does not allow clients to forge tier or activation date", function tierWrite() {
    expect(createCustomerSchema.safeParse({ idBusiness: 7, firstName: "Ana", lastName: "Perez", pricingTier: "WHOLESALE" }).success).toBe(false);
    expect(updateCustomerSchema.safeParse({ idBusiness: 7, idCustomer: 3, wholesaleSince: new Date() }).success).toBe(false);
  });
  it.each([{ wholesaleEnabled: false, wholesaleMinimumAmount: null }, { wholesaleEnabled: true, wholesaleMinimumAmount: 50000 }])("accepts paired policy %j", function valid(data) {
    expect(updateBusinessSchema.safeParse(data).success).toBe(true);
  });
  it.each([{ wholesaleEnabled: true }, { wholesaleMinimumAmount: 1 }, { wholesaleEnabled: true, wholesaleMinimumAmount: null },
    { wholesaleEnabled: true, wholesaleMinimumAmount: 0 }, { wholesaleEnabled: false, wholesaleMinimumAmount: -1 },
    { wholesaleEnabled: true, wholesaleMinimumAmount: 1.001 }])("rejects invalid policy %j", function invalid(data) {
    expect(updateBusinessSchema.safeParse(data).success).toBe(false);
  });
  it("business reads policy and settings reuse current tenant/procedure", async function settings() {
    expect(await getBusinessService(7)).toMatchObject({ wholesaleEnabled: true, wholesaleMinimumAmount: 50000 });
    await updateBusinessService(7, { wholesaleEnabled: false, wholesaleMinimumAmount: null });
    expect(mocks.poolQuery).toHaveBeenLastCalledWith("CALL sp_update_business(?, ?, ?, ?, ?, ?, ?, ?)", [7, null, null, null, 0, null, 0, null]);
  });
  it("public business includes real selected-tenant policy/defaults", async function publicPolicy() {
    expect(await getPublicCatalogService()).toMatchObject({ pricing: { wholesaleEnabled: true, wholesaleMinimumAmount: 50000 } });
    expect(mocks.poolQuery).toHaveBeenCalledWith("CALL sp_storefront_get_catalog(?)", ["selected-tenant"]);
    policy = { wholesale_enabled: 0, wholesale_minimum_amount: null };
    expect(await getPublicCatalogService()).toMatchObject({ pricing: { wholesaleEnabled: false, wholesaleMinimumAmount: null } });
  });
  it("list/detail expose price alias and wholesale price without private fields", async function publicPrices() {
    for (const result of [mapPublicCatalogProductListItem(publicRow()), mapPublicCatalogProductDetail(publicRow(), [])]) {
      expect(result).toMatchObject({ price: 15000, priceSale: 15000, priceWholesale: 10000 });
      expect(JSON.stringify(result)).not.toContain("PRIVATE");
    }
    expect(mapPublicCatalogProductListItem({ ...publicRow(), price_wholesale: null }).priceWholesale).toBeNull();
    expect((await getPublicCatalogProductsService({ page: 1, limit: 10, search: null, categorySlug: null })).items[0].priceWholesale).toBe(10000);
    expect(mocks.poolQuery).toHaveBeenLastCalledWith("CALL sp_storefront_get_products(?, ?, ?, ?, ?)", ["selected-tenant", 10, 0, null, null]);
  });
  it("SQL preserves historical NULL, adds defaults/checks and never downgrades in cancellation/refund", function sql() {
    const sale = readFileSync("src/db/procedures/sales.sql", "utf8");
    const migration = readFileSync("src/db/manual/007_wholesale_pricing.sql", "utf8");
    const schema = readFileSync("src/db/schema/002_create_tables.sql", "utf8");
    const constraints = readFileSync("src/db/schema/005_add_constraints.sql", "utf8");
    expect(schema).toContain("`pricing_type` enum('RETAIL','WHOLESALE') DEFAULT NULL");
    expect(migration).not.toMatch(/UPDATE\s+sales|UPDATE\s+customers|CREATE TABLE|TRUNCATE|DELETE FROM/i);
    expect(constraints).toContain("wholesale_minimum_amount IS NOT NULL");
    expect(constraints).toContain("wholesale_since IS NOT NULL");
    expect(sale).toMatch(/p_idOrder,\s+'RETAIL',/);
    const header = sale.slice(0, sale.indexOf("CREATE PROCEDURE sp_create_sale_detail"));
    const customerLock = header.indexOf("SELECT is_active INTO v_customerActive");
    expect(customerLock).toBeGreaterThan(header.indexOf("FROM cash_sessions cs"));
    expect(customerLock).toBeLessThan(header.indexOf("INSERT INTO sales"));
    expect(header.slice(customerLock, header.indexOf("INSERT INTO sales"))).toContain("FOR UPDATE");
    const cancel = sale.slice(sale.indexOf("CREATE PROCEDURE sp_cancel_sale"), sale.indexOf("CREATE PROCEDURE sp_get_sales"));
    expect(cancel).not.toMatch(/UPDATE\s+customers/i);
    expect(readFileSync("src/modules/businesses-app/sale-returns/services/sale-returns.service.ts", "utf8")).not.toMatch(/UPDATE\s+customers/i);
    const catalog = readFileSync("src/db/procedures/storefront_catalog.sql", "utf8");
    expect(catalog).not.toMatch(/price_cost|last_purchase_cost|external_cost/i);
    expect(catalog.match(/p\.price_wholesale/g)).toHaveLength(2);
  });
});
