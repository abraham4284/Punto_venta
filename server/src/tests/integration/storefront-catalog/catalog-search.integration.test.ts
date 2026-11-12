import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { publicCatalogConfig } from "@/config/public-catalog.config.js";
import { getTestApp } from "@/tests/helpers/test-app.helper.js";
import { executeInsert, executeMutation, querySingleRow, validateTestDatabaseEnvironment } from "@/tests/helpers/test-database.helper.js";
import type { PublicCatalogProductDetail, PublicCatalogProductsResponse } from "@/modules/storefront-app/catalog/types/catalog.types.js";

// Prepared gate only: no SQL installation, reset, global seeds or auth fixtures.
const tag = `catalog-search-${randomUUID()}`;
const originalConfig = { ...publicCatalogConfig };
const products: number[] = [];
let idBusiness: number;
let otherBusiness: number;
let fixturesStarted = false;
let auriculares: number;
let bluetooth: number;
let tws: number;
let outside: number;
let expectedRanking: number[];

function body(sql: string): string {
  return sql.slice(sql.indexOf("BEGIN")).replace(/\s+/g, " ").trim();
}
async function assertTestConnection(): Promise<void> {
  validateTestDatabaseEnvironment();
  if (process.env.NODE_ENV !== "test" || !["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST ?? "")) throw new Error("Catalog gate requires loopback test DB");
  const actual = await querySingleRow<RowDataPacket>("SELECT DATABASE() AS db");
  if (actual?.db !== "punto_venta_integration_test") throw new Error("Unexpected catalog gate database");
}
async function category(name: string, slug: string, business = idBusiness, active = 1): Promise<number> {
  return executeInsert("INSERT INTO product_categories (idBusiness,name,slug,is_active) VALUES (?,?,?,?)", [business, name, slug, active]);
}
async function product(name: string, idCategory: number, description: string | null = null, business = idBusiness, active = 1): Promise<number> {
  const id = await executeInsert("INSERT INTO products (idBusiness,idProductCategory,name,slug,description,price_cost,price_sale,is_active) VALUES (?,?,?,?,?,123,15000,?)", [business, idCategory, name, randomUUID(), description, active]);
  if (business === idBusiness && active === 1) products.push(id);
  return id;
}
async function search(query: Record<string, string | number> = {}): Promise<PublicCatalogProductsResponse> {
  const response = await request(getTestApp()).get("/api/public/catalog/products").query(query);
  expect(response.status, response.text).toBe(200);
  expect(response.body.status).toBe(true);
  return response.body.data as PublicCatalogProductsResponse;
}
function ids(result: PublicCatalogProductsResponse): number[] {
  return result.items.map(function id(item) { return item.idProduct; });
}

describe("catalog search and global stock HTTP/DB gate — explicit authorization required", function suite() {
  beforeAll(async function prepare() {
    await assertTestConnection();
    // Fail before fixtures if the installed procedure is not aligned with the canonical file.
    const source = readFileSync(new URL("../../../db/procedures/storefront_catalog.sql", import.meta.url), "utf8");
    for (const procedure of ["sp_storefront_get_products", "sp_storefront_get_product_by_slug"] as const) {
      const installed = await querySingleRow<RowDataPacket>(`SHOW CREATE PROCEDURE ${procedure}`);
      const canonical = source.split(`CREATE PROCEDURE ${procedure}(`)[1].split("END$$")[0] + "END";
      if (!installed || body(String(installed["Create Procedure"])).toLowerCase() !== body(canonical).toLowerCase()) {
        throw new Error(`Operator must align installed ${procedure} with canonical storefront_catalog.sql before gate`);
      }
    }
    fixturesStarted = true;
    idBusiness = await executeInsert("INSERT INTO businesses (name,slug,is_active,status) VALUES (?,?,1,'ACTIVE')", [tag, tag]);
    otherBusiness = await executeInsert("INSERT INTO businesses (name,slug,is_active,status) VALUES (?,?,1,'ACTIVE')", [tag, `${tag}-other`]);
    publicCatalogConfig.enabled = true;
    publicCatalogConfig.businessSlug = tag;
    auriculares = await category("Auriculares", "auriculares");
    bluetooth = await product("Bluetooth gamer G11", auriculares);
    tws = await product("TWS M10", auriculares);
    const general = await category("General", "general");
    outside = await product("Bluetooth fuera", general);
    await product("Nota especial", general, "Conexion bluetooth de escritorio");
    await product("Descripción única", general, "Fragancia exclusiva vainilla");
    await product("Speaker Z", await category("Parlantes", "parlantes"));
    await product("Esencia X", await category("Perfumes", "perfumes"));
    await product("Base facial", await category("Belleza", "maquillaje"));
    await product("Cargador USB", general);
    await product("No visible", auriculares, null, idBusiness, 0);
    await product("No visible categoria", await category("Auriculares ocultos", "ocultos", idBusiness, 0));
    products.pop(); // Active product in an inactive category is intentionally not public.
    await product("Auriculares ajenos", await category("Auriculares", "auriculares", otherBusiness), null, otherBusiness);

    // Alphabetic order deliberately opposes relevance; duplicate name verifies id tie-breaker.
    const exactProduct = await product("Probe", general);
    const exactCategory = await product("Zeta exact category", await category("Probe", "exact-probe"));
    const prefixProduct = await product("Probe prefix", general);
    const prefixTie = await product("Probe prefix", general);
    const prefixCategory = await product("Delta prefix category", await category("Probe extras", "prefix-probe"));
    const containsProduct = await product("Bravo probe item", general);
    const containsCategory = await product("Alpha category", await category("Combo probe gear", "contains-probe"));
    const description = await product("Able note", general, "Only description has probe");
    const slug = await product("Aardvark slug", await category("Accessories", "probe-only"));
    expectedRanking = [exactProduct, exactCategory, prefixProduct, prefixTie, prefixCategory, containsProduct, containsCategory, description, slug];
  });

  afterAll(async function cleanup() {
    Object.assign(publicCatalogConfig, originalConfig);
    if (!fixturesStarted) return;
    await assertTestConnection();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<RowDataPacket[]>("SELECT idBusiness FROM businesses WHERE slug IN (?,?)", [tag, `${tag}-other`]);
      const owned = rows.map(function id(row) { return Number(row.idBusiness); });
      if (owned.length) {
        // Remove fixture stock before its product and deposit foreign keys.
        for (const table of ["stock", "products", "product_categories", "deposits", "businesses"]) {
          await connection.query(`DELETE FROM \`${table}\` WHERE idBusiness IN (?)`, [owned]);
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback(); throw error;
    } finally {
      connection.release();
    }
    expect((await querySingleRow<RowDataPacket>("SELECT COUNT(*) AS total FROM businesses WHERE slug IN (?,?)", [tag, `${tag}-other`]))?.total).toBe(0);
    console.info(`Catalog gate cleanup OK: ${tag}; FK checks preserved`);
  });

  it("finds an exact product name first", async function exact() {
    expect(ids(await search({ search: "Probe" }))[0]).toBe(expectedRanking[0]);
  });
  it("finds a partial product name", async function partial() {
    expect(ids(await search({ search: "TWS" }))).toEqual([tws]);
  });
  it("finds description-only matches", async function description() {
    expect((await search({ search: "vainilla" })).items.map(function name(item) { return item.name; })).toEqual(["Descripción única"]);
  });
  it("finds category exact matches even when product text does not contain the term", async function exactCategory() {
    expect(ids(await search({ search: "auriculares" }))).toEqual([bluetooth, tws]);
  });
  it.each(["auricular", "AURICULARES"])("finds category partial/case term %s", async function partialCategory(term) {
    expect(ids(await search({ search: term }))).toEqual([bluetooth, tws]);
  });
  it("keeps accent-insensitive behavior of existing collation", async function accent() {
    expect((await search({ search: "descripcion unica" })).items[0].name).toBe("Descripción única");
  });
  it("finds category slug-only matches", async function slug() {
    expect((await search({ search: "maquillaje" })).items.map(function name(item) { return item.name; })).toEqual(["Base facial"]);
  });
  it("intersects search and categorySlug and keeps count aligned", async function intersection() {
    const result = await search({ search: "bluetooth", categorySlug: "auriculares" });
    expect(ids(result)).toEqual([bluetooth]);
    expect(ids(result)).not.toContain(outside);
    expect(result.pagination).toMatchObject({ total: 1, totalRecords: 1, totalPages: 1 });
  });
  it("no search retains alphabetic order and all active products in this tenant", async function noSearch() {
    const result = await search({ limit: 60 });
    expect(new Set(ids(result))).toEqual(new Set(products));
    expect(result.pagination.totalRecords).toBe(products.length);
    const collator = new Intl.Collator("es", { sensitivity: "base" });
    const sorted = [...result.items].sort(function compare(a, b) { return collator.compare(a.name, b.name) || a.idProduct - b.idProduct; });
    expect(ids(result)).toEqual(ids({ ...result, items: sorted }));
    expect(ids(await search({ search: "", limit: 60 }))).toEqual(ids(result));
  });
  it("ranks all strengths before pagination, with stable ties and full COUNT on every page", async function relevance() {
    const pages: number[] = [];
    for (let page = 1; page <= 5; page++) {
      const result = await search({ search: "probe", page, limit: 2 });
      expect(result.pagination).toMatchObject({ page, currentPage: page, total: 9, totalRecords: 9, totalPages: 5 });
      pages.push(...ids(result));
    }
    expect(pages).toEqual(expectedRanking);
  });
  it.each(["parlante", "parlantes", "perfume", "perfumes", "cargador", "gamer", "belleza"])("returns relevant fixtures for %s", async function realTerms(searchTerm) {
    const result = await search({ search: searchTerm });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.pagination.totalRecords).toBe(result.items.length);
  });
  it("empty intersections and beyond-last pages keep COUNT/totalPages consistent", async function empty() {
    expect((await search({ search: "perfume", categorySlug: "auriculares" })).pagination).toMatchObject({ totalRecords: 0, totalPages: 1 });
    const result = await search({ search: "auriculares", page: 2, limit: 2 });
    expect(result.items).toEqual([]);
    expect(result.pagination).toMatchObject({ totalRecords: 2, totalPages: 1 });
  });
  it("preserves the public DTO without costs or private fields", async function privacy() {
    const result = await search({ search: "auriculares" });
    expect(Object.keys(result.items[0]).sort()).toEqual(["idProduct", "name", "slug", "description", "price", "priceSale", "priceWholesale", "imageUrl", "category", "saleMode", "availabilityStatus", "availabilityNote", "stockAvailable", "secondaryImageUrl"].sort());
    expect(JSON.stringify(result)).not.toMatch(/price_cost|priceCost|supplier|margin|internal_notes/);
  });

  describe("T3 stock across active deposits", function globalStock() {
    let stockCategory: number;
    let principal: number;
    let local: number;
    let inactive: number;
    let secondary: number;

    async function deposit(name: string, isDefault: number, active: number, business = idBusiness): Promise<number> {
      return executeInsert("INSERT INTO deposits (idBusiness,name,is_default,is_active) VALUES (?,?,?,?)", [business, name, isDefault, active]);
    }

    async function addStock(idProduct: number, idDeposit: number, quantity: number, business = idBusiness): Promise<void> {
      await executeInsert("INSERT INTO stock (idBusiness,idProduct,idDeposit,quantity) VALUES (?,?,?,?)", [business, idProduct, idDeposit, quantity]);
    }

    async function expectAvailability(idProduct: number, stockAvailable: number, availabilityStatus: PublicCatalogProductDetail["availabilityStatus"]): Promise<void> {
      const list = await search({ categorySlug: "inventario-t3", limit: 60 });
      const item = list.items.find(function matches(row) { return row.idProduct === idProduct; });
      expect(item).toMatchObject({ stockAvailable, availabilityStatus });
      if (!item) throw new Error("Expected public fixture product in list");
      const response = await request(getTestApp()).get(`/api/public/catalog/products/${item.slug}`).expect(200);
      expect(response.body).toMatchObject({ status: true, data: { idProduct, stockAvailable, availabilityStatus } });
      expect(JSON.stringify([item, response.body.data])).not.toMatch(/idDeposit|deposit_name|stocksByDeposit|warehouseStock/);
    }

    beforeAll(async function setupStockFixtures() {
      stockCategory = await category("Inventario T3", "inventario-t3");
      principal = await deposit("Principal", 1, 1);
      local = await deposit("Local", 0, 1);
      inactive = await deposit("Inactivo", 0, 0);
      secondary = await deposit("Secundario", 0, 1);
    });

    it("adds active default and non-default stock while excluding inactive, other products and other tenants", async function globalTotal() {
      const id = await product("Saldo global", stockCategory);
      await addStock(id, principal, 2);
      await addStock(id, local, 5);
      await addStock(id, inactive, 11);
      await addStock(await product("Otro saldo", stockCategory), principal, 99);
      const foreignCategory = await category("Inventario T3", "inventario-t3", otherBusiness);
      const foreignProduct = await product("Saldo global", foreignCategory, null, otherBusiness);
      await addStock(foreignProduct, await deposit("Principal", 1, 1, otherBusiness), 1000, otherBusiness);
      await expectAvailability(id, 7, "in_stock");
      expect(ids(await search({ categorySlug: "inventario-t3", search: "Saldo global" }))).toEqual([id]);
    });

    it("reports in stock when only the non-default active deposit has a positive balance", async function nonDefault() {
      const id = await product("Saldo no predeterminado", stockCategory);
      await addStock(id, principal, 0);
      await addStock(id, local, 4);
      await expectAvailability(id, 4, "in_stock");
    });

    it("reports zero when only an inactive deposit has positive stock", async function inactiveOnly() {
      const id = await product("Saldo excluido", stockCategory);
      await addStock(id, principal, 0);
      await addStock(id, inactive, 8);
      await expectAvailability(id, 0, "out_of_stock");
    });

    it("keeps active products without stock rows visible with a zero balance", async function noStockRows() {
      await expectAvailability(await product("Sin filas T3", stockCategory), 0, "out_of_stock");
    });

    it.each([0, 7])("keeps ON_ORDER status with aggregate %s", async function onOrder(balance) {
      const id = await product(`Encargo T3 ${balance}`, stockCategory);
      await executeMutation("UPDATE products SET sale_mode='ON_ORDER' WHERE idBusiness=? AND idProduct=?", [idBusiness, id]);
      if (balance > 0) await addStock(id, local, balance);
      await expectAvailability(id, balance, "on_order");
    });

    it("keeps decimal precision and ignores negative and zero balances", async function decimals() {
      const id = await product("Fracciones T3", stockCategory);
      await executeMutation("UPDATE products SET unit_type='KG' WHERE idBusiness=? AND idProduct=?", [idBusiness, id]);
      await addStock(id, principal, 1.25);
      await addStock(id, local, 0.75);
      await addStock(id, secondary, -2);
      await expectAvailability(id, 2, "in_stock");
    });

    it("keeps the same public total after redistributing two units between active fixture deposits", async function redistribution() {
      const id = await product("Redistribución T3", stockCategory);
      await addStock(id, principal, 5);
      await addStock(id, local, 0);
      await expectAvailability(id, 5, "in_stock");
      // Single atomic update of fixture balances models the result of an internal transfer.
      const updated = await executeMutation(
        "UPDATE stock SET quantity = CASE WHEN idDeposit=? THEN quantity-2 ELSE quantity+2 END WHERE idBusiness=? AND idProduct=? AND idDeposit IN (?,?)",
        [principal, idBusiness, id, principal, local],
      );
      expect(updated.affectedRows).toBe(2);
      await expectAvailability(id, 5, "in_stock");
    });

    it("excludes and restores a balance when its deposit is deactivated and reactivated", async function activity() {
      const id = await product("Actividad T3", stockCategory);
      await addStock(id, principal, 2);
      await addStock(id, local, 5);
      await expectAvailability(id, 7, "in_stock");
      try {
        await executeMutation("UPDATE deposits SET is_active=0 WHERE idBusiness=? AND idDeposit=?", [idBusiness, local]);
        await expectAvailability(id, 2, "in_stock");
      } finally {
        await executeMutation("UPDATE deposits SET is_active=1 WHERE idBusiness=? AND idDeposit=?", [idBusiness, local]);
      }
      await expectAvailability(id, 7, "in_stock");
    });
  });
});
