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

function toNumber(value: string | number): number {
  return Number(value);
}

function toBoolean(value: string | number): boolean {
  return Number(value) > 0;
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
  };
}

export function mapPublicCatalogProductListItem(
  row: PublicCatalogProductDbRow,
): PublicCatalogProductListItem {
  return {
    idProduct: row.idProduct,
    name: row.name,
    description: row.description,
    price: toNumber(row.price_sale),
    imageUrl: row.image_url,
    category: {
      idProductCategory: row.idProductCategory,
      name: row.product_category_name,
    },
    available: toBoolean(row.available),
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
  return {
    ...mapPublicCatalogProductListItem(row),
    gallery,
  };
}
