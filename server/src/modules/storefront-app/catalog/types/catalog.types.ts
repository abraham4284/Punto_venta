import type { RowDataPacket } from "mysql2";
import type { ProductRichContent } from "@/shared/product-rich-content.js";
import type {
  ProductSaleMode,
  ProductSaleModeDb,
  PublicProductAvailabilityStatus,
} from "@/shared/product-sale-mode.js";

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
  slug: string;
}

export interface PublicCatalogCategory {
  idProductCategory: number;
  name: string;
  slug: string;
}

export interface PublicCatalogProductDbRow extends RowDataPacket {
  idProduct: number;
  name: string;
  slug: string;
  description: string | null;
  rich_content?: unknown;
  price_sale: string | number;
  image_url: string | null;
  sale_mode: ProductSaleModeDb | null;
  availability_note: string | null;
  secondary_image_url?: string | null;
  idProductCategory: number;
  product_category_slug: string;
  product_category_name: string;
  stock_available: string | number;
}

export interface PublicCatalogProductImageDbRow extends RowDataPacket {
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface PublicCatalogProductCategory {
  idProductCategory: number;
  name: string;
  slug: string;
}

export interface PublicCatalogProductImage {
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface PublicCatalogProductBase {
  idProduct: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: PublicCatalogProductCategory;
  saleMode: ProductSaleMode;
  availabilityStatus: PublicProductAvailabilityStatus;
  availabilityNote: string | null;
  stockAvailable: number;
}

export interface PublicCatalogProductListItem
  extends PublicCatalogProductBase {
  secondaryImageUrl: string | null;
}

export interface PublicCatalogProductDetail
  extends PublicCatalogProductBase {
  gallery: PublicCatalogProductImage[];
  richContent: ProductRichContent | null;
}

export interface PublicCatalogProductsFilters {
  page: number;
  limit: number;
  search: string | null;
  categorySlug: string | null;
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
