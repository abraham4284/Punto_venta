import { describe, expect, it } from "vitest";
import { mapPublicCatalogProductListItem } from "@/modules/storefront-app/catalog/helpers/catalog.mapper.js";
import type { PublicCatalogProductDbRow } from "@/modules/storefront-app/catalog/types/catalog.types.js";

function createProductRow(
  stockAvailable: string | number,
  available: string | number,
): PublicCatalogProductDbRow {
  return {
    idProduct: 1,
    name: "Producto publico",
    description: "Descripcion publica",
    price_sale: "1500.00",
    image_url: "https://example.com/product.jpg",
    secondary_image_url: null,
    idProductCategory: 3,
    product_category_name: "Categoria",
    stock_available: stockAvailable,
    available,
  } as PublicCatalogProductDbRow;
}

describe("public catalog product mapper", function publicCatalogMapperSuite() {
  it("marks product available when main deposit stock is positive", function testPositiveStock() {
    const product = mapPublicCatalogProductListItem(createProductRow("2.50", 0));

    expect(product.stockAvailable).toBe(2.5);
    expect(product.available).toBe(true);
  });

  it("marks product unavailable when main deposit stock is zero", function testZeroStock() {
    const product = mapPublicCatalogProductListItem(createProductRow("0.00", 1));

    expect(product.stockAvailable).toBe(0);
    expect(product.available).toBe(false);
  });

  it("never exposes negative public stock", function testNegativeStock() {
    const product = mapPublicCatalogProductListItem(createProductRow("-3.00", 1));

    expect(product.stockAvailable).toBe(0);
    expect(product.available).toBe(false);
  });
});
