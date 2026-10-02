export type ProductSaleModeDb = "STOCK" | "ON_ORDER";

export type ProductSaleMode = "stock" | "on_order";

export type PublicProductAvailabilityStatus =
  | "in_stock"
  | "out_of_stock"
  | "on_order";

export function toProductSaleMode(value: ProductSaleModeDb | null): ProductSaleMode {
  if (value === "ON_ORDER") {
    return "on_order";
  }

  return "stock";
}

export function toProductSaleModeDb(value: ProductSaleMode | null | undefined): ProductSaleModeDb {
  if (value === "on_order") {
    return "ON_ORDER";
  }

  return "STOCK";
}

export function getPublicAvailabilityStatus(
  saleMode: ProductSaleMode,
  stockAvailable: number,
): PublicProductAvailabilityStatus {
  if (saleMode === "on_order") {
    return "on_order";
  }

  return stockAvailable > 0 ? "in_stock" : "out_of_stock";
}
