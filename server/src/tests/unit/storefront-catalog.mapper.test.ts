import { describe, expect, it } from "vitest";
import { mapPublicCatalogProductListItem } from "@/modules/storefront-app/catalog/helpers/catalog.mapper.js";
import type { PublicCatalogProductDbRow } from "@/modules/storefront-app/catalog/types/catalog.types.js";
import type { ProductSaleModeDb } from "@/shared/product-sale-mode.js";

function createProductRow(
  stockAvailable: string | number,
  saleMode: ProductSaleModeDb = "STOCK",
  availabilityNote: string | null = null,
): PublicCatalogProductDbRow {
  return {
    idProduct: 1,
    name: "Producto publico",
    slug: "producto-publico",
    description: "Descripcion publica",
    price_sale: "1500.00",
    image_url: "https://example.com/product.jpg",
    sale_mode: saleMode,
    availability_note: availabilityNote,
    secondary_image_url: null,
    idProductCategory: 3,
    product_category_slug: "categoria",
    product_category_name: "Categoria",
    stock_available: stockAvailable,
  } as PublicCatalogProductDbRow;
}

describe("public catalog product mapper", function publicCatalogMapperSuite() {
  it("maps stock products with positive main deposit stock as in stock", function testPositiveStock() {
    const product = mapPublicCatalogProductListItem(createProductRow("2.50"));

    expect(product.slug).toBe("producto-publico");
    expect(product.category.slug).toBe("categoria");
    expect(product.saleMode).toBe("stock");
    expect(product.stockAvailable).toBe(2.5);
    expect(product.availabilityStatus).toBe("in_stock");
  });

  it("maps stock products with zero main deposit stock as out of stock", function testZeroStock() {
    const product = mapPublicCatalogProductListItem(createProductRow("0.00"));

    expect(product.stockAvailable).toBe(0);
    expect(product.availabilityStatus).toBe("out_of_stock");
  });

  it("never exposes negative public stock", function testNegativeStock() {
    const product = mapPublicCatalogProductListItem(createProductRow("-3.00"));

    expect(product.stockAvailable).toBe(0);
    expect(product.availabilityStatus).toBe("out_of_stock");
  });

  it("prioritizes on order sale mode over physical stock", function testOnOrderStock() {
    const product = mapPublicCatalogProductListItem(
      createProductRow("5.00", "ON_ORDER", "Entrega estimada entre 7 y 10 dias"),
    );

    expect(product.stockAvailable).toBe(5);
    expect(product.saleMode).toBe("on_order");
    expect(product.availabilityStatus).toBe("on_order");
    expect(product.availabilityNote).toBe("Entrega estimada entre 7 y 10 dias");
  });
});
