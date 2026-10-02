import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { assertSubscriptionResourceAvailable } from "@/modules/businesses-app/subscription/services/subscription-limits.service.js";
import { serializeProductRichContent } from "@/shared/product-rich-content.js";
import { resolveUniqueSlug } from "@/shared/slug.js";
import { toProductSaleModeDb } from "@/shared/product-sale-mode.js";
import { mapProduct, mapProductDetail } from "../helpers/product.mapper.js";
import type {
  CreateProductPayload,
  ProductDetailDbRow,
  ProductDetailResponse,
  ProductDbRow,
  ProductListFilters,
  ProductListResponse,
  ProductResponse,
  ToggleProductStatusPayload,
  UpdateProductPricesInput,
  UpdateProductPayload,
} from "../types/index.js";

interface ProductTotalDbRow extends RowDataPacket {
  totalRecords: number;
}

interface ProductSlugRow extends RowDataPacket {
  slug: string;
}

interface DbError {
  code?: string;
  sqlMessage?: string;
  message?: string;
}

async function productSlugExists(
  idBusiness: number,
  slug: string,
): Promise<boolean> {
  const [rows] = await pool.query<ProductSlugRow[]>(
    `SELECT slug
     FROM products
     WHERE idBusiness = ?
       AND slug = ?
     LIMIT 1`,
    [idBusiness, slug],
  );

  return Boolean(rows[0]);
}

function isDuplicateProductSlugError(error: unknown): boolean {
  const dbError = error as DbError;
  const message = dbError.sqlMessage || dbError.message || "";

  return dbError.code === "ER_DUP_ENTRY" && message.includes("uk_product_business_slug");
}

export async function createProductService(
  data: CreateProductPayload,
): Promise<ProductDetailResponse> {
  await assertSubscriptionResourceAvailable(data.idBusiness, "PRODUCTS", 1);
  const richContent = serializeProductRichContent(data.richContent ?? null);
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const slug = await resolveUniqueSlug(
      data.name,
      function exists(candidate) {
        return productSlugExists(data.idBusiness, candidate);
      },
      { maxAttempts: 50 + attempt },
    );

    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "CALL sp_create_product(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          data.idBusiness,
          data.idProductCategory,
          data.idDeposit,
          data.initialStock,
          data.barcode ?? null,
          data.name,
          slug,
          data.description ?? null,
          richContent,
          data.imageUrl ?? null,
          data.priceCost,
          data.priceSale,
          data.priceWholesale ?? null,
          data.unitType,
          toProductSaleModeDb(data.saleMode),
          data.availabilityNote ?? null,
          data.stockMin ?? 0,
        ],
      );

      const result = rows as unknown as ProductDetailDbRow[][];
      const product = result[0]?.[0];

      if (!product) {
        throw new Error("No se pudo crear el producto");
      }

      return mapProductDetail(product);
    } catch (error) {
      if (attempt < maxAttempts && isDuplicateProductSlugError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("No se pudo generar un slug unico para el producto");
}

export async function getProductsService(
  filters: ProductListFilters,
): Promise<ProductListResponse> {
  const offset = (filters.page - 1) * filters.limit;
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_products(?, ?, ?, ?, ?, ?)",
    [
      filters.idBusiness,
      filters.limit,
      offset,
      filters.search,
      filters.idProductCategory,
      filters.isActive === null ? null : filters.isActive ? 1 : 0,
    ],
  );

  const result = rows as unknown as [ProductDbRow[], ProductTotalDbRow[]];
  const items = (result[0] ?? []).map(mapProduct);
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

export async function getProductByIdService(
  idBusiness: number,
  idProduct: number,
): Promise<ProductDetailResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_product_by_id(?, ?)",
    [idBusiness, idProduct],
  );

  const result = rows as unknown as ProductDetailDbRow[][];
  const product = result[0]?.[0];

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  return mapProductDetail(product);
}

export async function updateProductService(
  data: UpdateProductPayload,
): Promise<ProductDetailResponse> {
  const hasRichContent = Object.hasOwn(data, "richContent");
  const richContent = hasRichContent
    ? serializeProductRichContent(data.richContent ?? null)
    : null;
  const hasSaleMode = Object.hasOwn(data, "saleMode");
  const hasAvailabilityNote = Object.hasOwn(data, "availabilityNote");

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_product(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idProduct,
      data.idProductCategory ?? null,
      Object.hasOwn(data, "idProductCategory") ? 1 : 0,
      data.barcode ?? null,
      Object.hasOwn(data, "barcode") ? 1 : 0,
      data.name ?? null,
      data.description ?? null,
      Object.hasOwn(data, "description") ? 1 : 0,
      richContent,
      hasRichContent ? 1 : 0,
      data.imageUrl ?? null,
      Object.hasOwn(data, "imageUrl") ? 1 : 0,
      data.priceCost ?? null,
      data.priceSale ?? null,
      data.priceWholesale ?? null,
      Object.hasOwn(data, "priceWholesale") ? 1 : 0,
      data.unitType ?? null,
      Object.hasOwn(data, "unitType") ? 1 : 0,
      hasSaleMode ? toProductSaleModeDb(data.saleMode) : null,
      hasSaleMode ? 1 : 0,
      data.availabilityNote ?? null,
      hasAvailabilityNote ? 1 : 0,
      data.stockMin ?? null,
    ],
  );

  const result = rows as unknown as ProductDetailDbRow[][];
  const product = result[0]?.[0];

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  return mapProductDetail(product);
}

export async function updateProductPricesService(
  data: UpdateProductPricesInput,
): Promise<ProductResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_product_prices(?, ?, ?, ?, ?)",
    [
      data.idProduct,
      data.idBusiness,
      data.priceCost,
      data.priceSale,
      data.priceWholesale ?? null,
    ],
  );

  const result = rows as unknown as ProductDbRow[][];
  const product = result[0]?.[0];

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  return mapProduct(product);
}

export async function toggleProductStatusService(
  data: ToggleProductStatusPayload,
): Promise<ProductResponse> {
  const currentProduct = await getProductByIdService(data.idBusiness, data.idProduct);

  if (!currentProduct.isActive && data.isActive) {
    await assertSubscriptionResourceAvailable(data.idBusiness, "PRODUCTS", 1);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_toggle_product_status(?, ?, ?)",
    [data.idBusiness, data.idProduct, data.isActive ? 1 : 0],
  );

  const result = rows as unknown as ProductDbRow[][];
  const product = result[0]?.[0];

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  return mapProduct(product);
}
