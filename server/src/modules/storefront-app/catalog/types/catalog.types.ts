import type { RowDataPacket } from "mysql2";

export interface PublicCatalogBusinessDbRow extends RowDataPacket {
  name: string;
  slug: string;
  logo_url: string | null;
  business_type: string | null;
}

export interface PublicCatalogBusiness {
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: string | null;
}

export interface PublicCatalogCategoryDbRow extends RowDataPacket {
  idProductCategory: number;
  name: string;
}

export interface PublicCatalogCategory {
  idProductCategory: number;
  name: string;
}

export interface PublicCatalogProductDbRow extends RowDataPacket {
  idProduct: number;
  name: string;
  description: string | null;
  price_sale: string | number;
  image_url: string | null;
  idProductCategory: number;
  product_category_name: string;
  available: string | number;
}

export interface PublicCatalogProductImageDbRow extends RowDataPacket {
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface PublicCatalogProductCategory {
  idProductCategory: number;
  name: string;
}

export interface PublicCatalogProductImage {
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface PublicCatalogProductListItem {
  idProduct: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: PublicCatalogProductCategory;
  available: boolean;
}

export interface PublicCatalogProductDetail
  extends PublicCatalogProductListItem {
  gallery: PublicCatalogProductImage[];
}

export interface PublicCatalogProductsFilters {
  page: number;
  limit: number;
  search: string | null;
  idProductCategory: number | null;
}

export interface PublicCatalogPagination {
  page: number;
  currentPage: number;
  limit: number;
  total: number;
  totalRecords: number;
  totalPages: number;
}

export interface PublicCatalogProductsResponse {
  items: PublicCatalogProductListItem[];
  pagination: PublicCatalogPagination;
}

export interface PublicCatalogTotalDbRow extends RowDataPacket {
  totalRecords: number;
}
