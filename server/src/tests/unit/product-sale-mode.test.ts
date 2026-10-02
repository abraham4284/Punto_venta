import { describe, expect, it } from "vitest";
import {
  getPublicAvailabilityStatus,
  toProductSaleMode,
  toProductSaleModeDb,
} from "@/shared/product-sale-mode.js";

describe("product sale mode and public availability", function productSaleModeSuite() {
  it("maps api and db sale mode values", function testSaleModeMapping() {
    expect(toProductSaleMode("STOCK")).toBe("stock");
    expect(toProductSaleMode("ON_ORDER")).toBe("on_order");
    expect(toProductSaleModeDb("stock")).toBe("STOCK");
    expect(toProductSaleModeDb("on_order")).toBe("ON_ORDER");
  });

  it("derives stock availability status", function testStockStatus() {
    expect(getPublicAvailabilityStatus("stock", 5)).toBe("in_stock");
    expect(getPublicAvailabilityStatus("stock", 0)).toBe("out_of_stock");
    expect(getPublicAvailabilityStatus("stock", -2)).toBe("out_of_stock");
  });

  it("prioritizes on order sale mode", function testOnOrderStatus() {
    expect(getPublicAvailabilityStatus("on_order", 0)).toBe("on_order");
    expect(getPublicAvailabilityStatus("on_order", 5)).toBe("on_order");
  });
});
