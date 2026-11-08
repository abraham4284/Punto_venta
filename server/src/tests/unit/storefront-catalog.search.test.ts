import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const mocks = vi.hoisted(function state() { return { query: vi.fn() }; });
vi.mock("@/db/db.js", function database() { return { pool: { query: mocks.query } }; });
vi.mock("@/config/public-catalog.config.js", function config() {
  return { publicCatalogConfig: { enabled: true, businessSlug: "selected-tenant" } };
});

import { getPublicCatalogProductsService } from "@/modules/storefront-app/catalog/services/catalog.service.js";
import { getPublicCatalogProductsController } from "@/modules/storefront-app/catalog/controllers/catalog.controller.js";
import { publicCatalogProductsQuerySchema } from "@/modules/storefront-app/catalog/validations/catalog.validations.js";

const source = readFileSync(new URL("../../db/procedures/storefront_catalog.sql", import.meta.url), "utf8");
const procedure = source.split("CREATE PROCEDURE sp_storefront_get_products(")[1].split("END$$")[0];
const select = procedure.split("SELECT COUNT(DISTINCT p.idProduct)")[0];
const count = procedure.split("SELECT COUNT(DISTINCT p.idProduct)")[1];
function where(sql: string): string {
  return sql.slice(sql.lastIndexOf("WHERE b.slug = p_business_slug")).split("ORDER BY")[0].replace(/;\s*$/, "").replace(/\s+/g, " ").trim();
}

describe("catalog SQL search contract (file-only, not SQL execution)", function sqlContract() {
  it("SELECT and COUNT use the identical complete WHERE universe", function sameFilter() {
    expect(where(select)).toBe(where(count));
  });
  it.each(["p.name", "p.description", "pc.name", "pc.slug"])("both queries search %s by substring", function field(field) {
    for (const sql of [select, count]) expect(where(sql)).toContain(`OR ${field} LIKE CONCAT('%', p_search, '%')`);
  });
  it("categorySlug remains an AND filter outside the parenthesized search", function intersection() {
    expect(where(select)).toMatch(/OR pc\.slug LIKE CONCAT\('%', p_search, '%'\) \) AND \( p_category_slug IS NULL OR p_category_slug = '' OR pc\.slug = p_category_slug \)$/);
  });
  it("ranks all eight strengths in order, before LIMIT/OFFSET; ties are stable", function ranking() {
    const order = select.slice(select.lastIndexOf("ORDER BY"));
    expect(order.replace(/\s+/g, " ").trim()).toBe("ORDER BY CASE WHEN p_search IS NULL OR p_search = '' THEN 100 WHEN p.name = p_search THEN 1 WHEN pc.name = p_search THEN 2 WHEN p.name LIKE CONCAT(p_search, '%') THEN 3 WHEN pc.name LIKE CONCAT(p_search, '%') THEN 4 WHEN p.name LIKE CONCAT('%', p_search, '%') THEN 5 WHEN pc.name LIKE CONCAT('%', p_search, '%') THEN 6 WHEN p.description LIKE CONCAT('%', p_search, '%') THEN 7 WHEN pc.slug LIKE CONCAT('%', p_search, '%') THEN 8 ELSE 100 END, p.name ASC, p.idProduct ASC LIMIT p_limit OFFSET p_offset;");
    expect(count).not.toContain("ORDER BY");
  });
  it("preserves tenant/active restrictions, signature and collation", function boundaries() {
    for (const sql of [select, count]) {
      expect(sql).toContain("ON p.idBusiness = b.idBusiness");
      expect(sql).toContain("ON pc.idBusiness = b.idBusiness");
      expect(sql).toContain("AND pc.idProductCategory = p.idProductCategory");
      for (const guard of ["b.is_active = 1", "b.status = 'ACTIVE'", "p.is_active = 1", "pc.is_active = 1"]) expect(where(sql)).toContain(guard);
    }
    expect(procedure.match(/\bIN p_\w+/g)).toEqual(["IN p_business_slug", "IN p_limit", "IN p_offset", "IN p_search", "IN p_category_slug"]);
    expect(procedure.match(/COLLATE utf8mb4_unicode_ci/g)).toHaveLength(3);
  });
});

beforeEach(function reset() {
  mocks.query.mockReset();
  mocks.query.mockImplementation(async function query(sql: string) {
    if (sql.includes("sp_storefront_get_catalog")) return [[[{ name: "Tenant", slug: "selected-tenant", wholesale_enabled: 0, wholesale_minimum_amount: null }]]];
    return [[[], [{ totalRecords: 0 }]]];
  });
});

describe("public catalog transport (mocked pool, no SQL execution)", function transport() {
  it.each(["Auriculares", "auricular", "parlante", "parlantes", "perfume", "perfumes", "cargador", "bluetooth", "gamer", "belleza", "maquillaje"])("passes term %s unchanged to existing procedure", async function term(search) {
    await getPublicCatalogProductsService(publicCatalogProductsQuerySchema.parse({ search }));
    expect(mocks.query).toHaveBeenLastCalledWith("CALL sp_storefront_get_products(?, ?, ?, ?, ?)", ["selected-tenant", 24, 0, search, null]);
  });
  it.each([undefined, "", "   "])("normalizes empty search %s to null without changing defaults", async function empty(search) {
    const result = await getPublicCatalogProductsService(publicCatalogProductsQuerySchema.parse({ search }));
    expect(mocks.query).toHaveBeenLastCalledWith(expect.any(String), ["selected-tenant", 24, 0, null, null]);
    expect(result.pagination).toEqual({ page: 1, currentPage: 1, limit: 24, total: 0, totalRecords: 0, totalPages: 1 });
  });
  it("passes search and category together, computes offset and totalPages from COUNT", async function page() {
    mocks.query.mockResolvedValueOnce([[[{ name: "Tenant", slug: "selected-tenant" }]]])
      .mockResolvedValueOnce([[[], [{ totalRecords: "5" }]]]);
    const result = await getPublicCatalogProductsService(publicCatalogProductsQuerySchema.parse({ search: " bluetooth ", categorySlug: "auriculares", page: "2", limit: "2" }));
    expect(mocks.query).toHaveBeenLastCalledWith(expect.any(String), ["selected-tenant", 2, 2, "bluetooth", "auriculares"]);
    expect(result.pagination).toEqual({ page: 2, currentPage: 2, limit: 2, total: 5, totalRecords: 5, totalPages: 3 });
  });
  it("keeps DB order and the exact public DTO, excluding private fields", async function projection() {
    const row = { name: "TWS M10", slug: "tws-m10", description: null, price_sale: "15000", price_wholesale: "12000", image_url: null, sale_mode: "STOCK", availability_note: null, stock_available: "0", idProductCategory: 1, product_category_slug: "auriculares", product_category_name: "Auriculares", price_cost: "PRIVATE", supplier: "PRIVATE", margin: "PRIVATE", internal_notes: "PRIVATE" };
    mocks.query.mockResolvedValueOnce([[[{ name: "Tenant", slug: "selected-tenant" }]]])
      .mockResolvedValueOnce([[[{ ...row, idProduct: 9 }, { ...row, idProduct: 1 }], [{ totalRecords: 2 }]]]);
    const result = await getPublicCatalogProductsService(publicCatalogProductsQuerySchema.parse({ search: "auriculares" }));
    expect(result.items.map(function id(item) { return item.idProduct; })).toEqual([9, 1]);
    expect(Object.keys(result.items[0]).sort()).toEqual(["idProduct", "name", "slug", "description", "price", "priceSale", "priceWholesale", "imageUrl", "category", "saleMode", "availabilityStatus", "availabilityNote", "stockAvailable", "secondaryImageUrl"].sort());
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });
  it("controller retains status/message/data envelope and rejects extra search parameters", async function controller() {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res); res.json.mockReturnValue(res);
    await getPublicCatalogProductsController({ query: { search: "auriculares" } } as unknown as Request, res as unknown as Response);
    expect(res.status).toHaveBeenLastCalledWith(200);
    expect(res.json).toHaveBeenLastCalledWith({ status: true, message: "Productos obtenidos correctamente", data: { items: [], pagination: { page: 1, currentPage: 1, limit: 24, total: 0, totalRecords: 0, totalPages: 1 } } });
    expect(publicCatalogProductsQuerySchema.safeParse({ searchMode: "category" }).success).toBe(false);
  });
});
