import type { RowDataPacket } from "mysql2";
import { publicCatalogConfig } from "@/config/public-catalog.config.js";
import { pool } from "@/db/db.js";
import {
  mapPublicCatalogBusiness,
  mapPublicCatalogCategory,
  mapPublicCatalogImage,
  mapPublicCatalogProductDetail,
  mapPublicCatalogProductListItem,
} from "../helpers/catalog.mapper.js";
import type {
  PublicCatalogBusiness,
  PublicCatalogBusinessDbRow,
  PublicCatalogCategory,
  PublicCatalogCategoryDbRow,
  PublicCatalogProductDbRow,
  PublicCatalogProductDetail,
  PublicCatalogProductImageDbRow,
  PublicCatalogProductsFilters,
  PublicCatalogProductsResponse,
  PublicCatalogTotalDbRow,
} from "../types/catalog.types.js";

export class PublicCatalogUnavailableError extends Error {
  public readonly statusCode = 404;

  constructor() {
    super("Catalogo publico no disponible");
    this.name = "PublicCatalogUnavailableError";
  }
}

function getRequiredPublicCatalogSlug(): string {
  if (!publicCatalogConfig.enabled || !publicCatalogConfig.businessSlug) {
    throw new PublicCatalogUnavailableError();
  }

  return publicCatalogConfig.businessSlug;
}

async function getPublicCatalogBusinessBySlug(
  businessSlug: string,
): Promise<PublicCatalogBusiness> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_storefront_get_catalog(?)",
    [businessSlug],
  );

  const result = rows as unknown as PublicCatalogBusinessDbRow[][];
  const business = result[0]?.[0];

  if (!business) {
    throw new PublicCatalogUnavailableError();
  }

  return mapPublicCatalogBusiness(business);
}

export async function getPublicCatalogService(): Promise<PublicCatalogBusiness> {
  const businessSlug = getRequiredPublicCatalogSlug();

  return getPublicCatalogBusinessBySlug(businessSlug);
}

export async function getPublicCatalogCategoriesService(): Promise<
  PublicCatalogCategory[]
> {
  const businessSlug = getRequiredPublicCatalogSlug();
  await getPublicCatalogBusinessBySlug(businessSlug);

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_storefront_get_categories(?)",
    [businessSlug],
  );

  const result = rows as unknown as PublicCatalogCategoryDbRow[][];

  return (result[0] ?? []).map(mapPublicCatalogCategory);
}

export async function getPublicCatalogProductsService(
  filters: PublicCatalogProductsFilters,
): Promise<PublicCatalogProductsResponse> {
  const businessSlug = getRequiredPublicCatalogSlug();
  await getPublicCatalogBusinessBySlug(businessSlug);
  const offset = (filters.page - 1) * filters.limit;

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_storefront_get_products(?, ?, ?, ?, ?)",
    [
      businessSlug,
      filters.limit,
      offset,
      filters.search,
      filters.idProductCategory,
    ],
  );

  const result = rows as unknown as [
    PublicCatalogProductDbRow[],
    PublicCatalogTotalDbRow[],
  ];
  const items = (result[0] ?? []).map(mapPublicCatalogProductListItem);
  const total = Number(result[1]?.[0]?.totalRecords ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  return {
    items,
    pagination: {
      page: filters.page,
      currentPage: filters.page,
      limit: filters.limit,
      total,
      totalRecords: total,
      totalPages,
    },
  };
}

export async function getPublicCatalogProductByIdService(
  idProduct: number,
): Promise<PublicCatalogProductDetail> {
  const businessSlug = getRequiredPublicCatalogSlug();
  await getPublicCatalogBusinessBySlug(businessSlug);

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_storefront_get_product_by_id(?, ?)",
    [businessSlug, idProduct],
  );

  const result = rows as unknown as [
    PublicCatalogProductDbRow[],
    PublicCatalogProductImageDbRow[],
  ];
  const product = result[0]?.[0];

  if (!product) {
    throw new PublicCatalogUnavailableError();
  }

  const gallery = (result[1] ?? []).map(mapPublicCatalogImage);

  return mapPublicCatalogProductDetail(product, gallery);
}
