import type {
  PublicCatalogBusiness,
  PublicCatalogBusinessDbRow,
  PublicCatalogCategory,
  PublicCatalogCategoryDbRow,
  PublicCatalogProductDbRow,
  PublicCatalogProductDetail,
  PublicCatalogProductImage,
  PublicCatalogProductImageDbRow,
  PublicCatalogProductListItem,
} from "../types/catalog.types.js";
import { parseProductRichContentFromDb } from "@/shared/product-rich-content.js";
import {
  getPublicAvailabilityStatus,
  toProductSaleMode,
} from "@/shared/product-sale-mode.js";

function toNumber(value: string | number): number {
  return Number(value);
}

function toPublicStockAvailable(value: string | number): number {
  const stockAvailable = Number(value);

  if (!Number.isFinite(stockAvailable)) {
    return 0;
  }

  return Math.max(0, stockAvailable);
}

export function mapPublicCatalogBusiness(
  row: PublicCatalogBusinessDbRow,
): PublicCatalogBusiness {
  return {
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    businessType: row.business_type,
  };
}

export function mapPublicCatalogCategory(
  row: PublicCatalogCategoryDbRow,
): PublicCatalogCategory {
  return {
    idProductCategory: row.idProductCategory,
    name: row.name,
    slug: row.slug,
  };
}

export function mapPublicCatalogProductListItem(
  row: PublicCatalogProductDbRow,
): PublicCatalogProductListItem {
  const stockAvailable = toPublicStockAvailable(row.stock_available);
  const saleMode = toProductSaleMode(row.sale_mode);

  return {
    idProduct: row.idProduct,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: toNumber(row.price_sale),
    imageUrl: row.image_url,
    category: {
      idProductCategory: row.idProductCategory,
      name: row.product_category_name,
      slug: row.product_category_slug,
    },
    saleMode,
    availabilityStatus: getPublicAvailabilityStatus(saleMode, stockAvailable),
    availabilityNote: row.availability_note,
    stockAvailable,
    secondaryImageUrl: row.secondary_image_url ?? null,
  };
}

export function mapPublicCatalogImage(
  row: PublicCatalogProductImageDbRow,
): PublicCatalogProductImage {
  return {
    imageUrl: row.image_url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
  };
}

export function mapPublicCatalogProductDetail(
  row: PublicCatalogProductDbRow,
  gallery: PublicCatalogProductImage[],
): PublicCatalogProductDetail {
  const base = mapPublicCatalogProductListItem(row);

  return {
    idProduct: base.idProduct,
    name: base.name,
    slug: base.slug,
    description: base.description,
    price: base.price,
    imageUrl: base.imageUrl,
    category: base.category,
    saleMode: base.saleMode,
    availabilityStatus: base.availabilityStatus,
    availabilityNote: base.availabilityNote,
    stockAvailable: base.stockAvailable,
    gallery,
    richContent: parseProductRichContentFromDb(row.rich_content ?? null),
  };
}
