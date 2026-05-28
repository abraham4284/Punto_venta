import type { ProductDbRow, ProductResponse } from "../types/index.js";

function toNumber(value: string | number): number {
  return Number(value);
}

function toNullableNumber(value: string | number | null): number | null {
  if (value === null) {
    return null;
  }

  return Number(value);
}

export function mapProduct(product: ProductDbRow): ProductResponse {
  return {
    idProduct: product.idProduct,
    idBusiness: product.idBusiness,
    idProductCategory: product.idProductCategory,
    productCategoryName: product.product_category_name,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url,
    priceCost: toNumber(product.price_cost),
    priceSale: toNumber(product.price_sale),
    priceWholesale: toNullableNumber(product.price_wholesale),
    stockMin: toNumber(product.stock_min),
    isActive: Boolean(product.is_active),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}
