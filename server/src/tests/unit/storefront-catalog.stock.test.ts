import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapPublicCatalogProductDetail, mapPublicCatalogProductListItem } from "@/modules/storefront-app/catalog/helpers/catalog.mapper.js";
import type { PublicCatalogProductDbRow } from "@/modules/storefront-app/catalog/types/catalog.types.js";

const sql = readFileSync(new URL("../../db/procedures/storefront_catalog.sql", import.meta.url), "utf8");
const procedures = ["sp_storefront_get_products", "sp_storefront_get_product_by_slug"];

function stockJoin(procedure: string): string {
  const body = sql.split(`CREATE PROCEDURE ${procedure}(`)[1].split("END$$")[0];
  const join = body.match(/LEFT JOIN \(\s*SELECT\s+s\.idBusiness,[\s\S]*?active_stock\.idProduct = p\.idProduct/);
  expect(join).not.toBeNull();
  expect(body).toContain("COALESCE(active_stock.stock_available, 0) AS stock_available");
  return join![0].replace(/\s+/g, " ");
}

describe("public stock SQL contract", function stockSql() {
  it.each(procedures)("%s sums positive stock only in active deposits, scoped to business and product", function aggregation(procedure) {
    const join = stockJoin(procedure);
    expect(join).toContain("COALESCE(SUM( CASE WHEN s.quantity > 0 THEN s.quantity ELSE 0 END ), 0)");
    expect(join).toContain("ON d.idBusiness = s.idBusiness AND d.idDeposit = s.idDeposit AND d.is_active = 1");
    expect(join).not.toContain("is_default");
    expect(join).toContain("GROUP BY s.idBusiness, s.idProduct");
    expect(join).toContain("ON active_stock.idBusiness = b.idBusiness AND active_stock.idProduct = p.idProduct");
  });

  it("shares the same aggregate and fallback between listing and detail", function parity() {
    expect(stockJoin(procedures[0])).toBe(stockJoin(procedures[1]));
  });
});

function row(stock: string, saleMode: PublicCatalogProductDbRow["sale_mode"]): PublicCatalogProductDbRow {
  return {
    idProduct: 14, name: "Producto", slug: "producto", description: null,
    price_sale: "15000", price_wholesale: "10000", image_url: null,
    secondary_image_url: "https://example.com/secondary.jpg",
    sale_mode: saleMode, availability_note: null, stock_available: stock,
    idProductCategory: 1, product_category_slug: "categoria", product_category_name: "Categoría",
    idDeposit: 99, deposit_name: "PRIVATE", price_cost: "PRIVATE",
  } as PublicCatalogProductDbRow;
}

describe("public stock DTO", function stockDto() {
  it.each([
    ["STOCK", "7", 7, "in_stock"],
    ["STOCK", "0", 0, "out_of_stock"],
    ["STOCK", "-2", 0, "out_of_stock"],
    ["STOCK", "2.25", 2.25, "in_stock"],
    ["ON_ORDER", "0", 0, "on_order"],
    ["ON_ORDER", "7", 7, "on_order"],
  ] as const)("maps %s %s to %s / %s in both endpoints", function availability(mode, input, expectedStock, expectedStatus) {
    const source = row(input, mode);
    const expected = { stockAvailable: expectedStock, availabilityStatus: expectedStatus };
    expect(mapPublicCatalogProductListItem(source)).toMatchObject(expected);
    expect(mapPublicCatalogProductDetail(source, [])).toMatchObject(expected);
  });

  it("keeps exactly the public list and detail keys, prices and images without deposit information", function projection() {
    const source = row("7", "STOCK");
    const list = mapPublicCatalogProductListItem(source);
    const gallery = [{ imageUrl: "https://example.com/gallery.jpg", altText: null, sortOrder: 1 }];
    const detail = mapPublicCatalogProductDetail(source, gallery);
    const common = ["idProduct", "name", "slug", "description", "price", "priceSale", "priceWholesale", "imageUrl",
      "category", "saleMode", "availabilityStatus", "availabilityNote", "stockAvailable"];
    expect(Object.keys(list).sort()).toEqual([...common, "secondaryImageUrl"].sort());
    expect(Object.keys(detail).sort()).toEqual([...common, "gallery", "richContent"].sort());
    expect(list).toMatchObject({ price: 15000, priceSale: 15000, priceWholesale: 10000, secondaryImageUrl: source.secondary_image_url });
    expect(detail).toMatchObject({ price: 15000, priceSale: 15000, priceWholesale: 10000, gallery });
    expect(JSON.stringify([list, detail])).not.toContain("PRIVATE");
  });
});
