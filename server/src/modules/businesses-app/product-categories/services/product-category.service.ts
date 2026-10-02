import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { resolveUniqueSlug } from "@/shared/slug.js";
import { mapProductCategory } from "../helpers/product-category.mapper.js";
import type {
  CreateProductCategoryBody,
  ProductCategoryDbRow,
  ProductCategoryResponse,
  UpdateProductCategoryBody,
} from "../types/product-category.types.js";

interface ProductCategorySlugRow extends RowDataPacket {
  slug: string;
}

interface DbError {
  code?: string;
  sqlMessage?: string;
  message?: string;
}

async function productCategorySlugExists(
  idBusiness: number,
  slug: string,
): Promise<boolean> {
  const [rows] = await pool.query<ProductCategorySlugRow[]>(
    `SELECT slug
     FROM product_categories
     WHERE idBusiness = ?
       AND slug = ?
     LIMIT 1`,
    [idBusiness, slug],
  );

  return Boolean(rows[0]);
}

function isDuplicateProductCategorySlugError(error: unknown): boolean {
  const dbError = error as DbError;
  const message = dbError.sqlMessage || dbError.message || "";

  return dbError.code === "ER_DUP_ENTRY" && message.includes("uk_category_business_slug");
}

export async function createProductCategoryService(
  idBusiness: number,
  data: CreateProductCategoryBody,
): Promise<ProductCategoryResponse> {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const slug = await resolveUniqueSlug(
      data.name,
      function exists(candidate) {
        return productCategorySlugExists(idBusiness, candidate);
      },
      { maxAttempts: 50 + attempt },
    );

    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "CALL sp_create_product_category(?, ?, ?, ?, ?)",
        [
          idBusiness,
          data.name,
          slug,
          data.description ?? null,
          data.isDefault ? 1 : 0,
        ],
      );

      const result = rows as unknown as ProductCategoryDbRow[][];
      const productCategory = result[0]?.[0];

      if (!productCategory) {
        throw new Error("No se pudo crear la categoria");
      }

      return mapProductCategory(productCategory);
    } catch (error) {
      if (attempt < maxAttempts && isDuplicateProductCategorySlugError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("No se pudo generar un slug unico para la categoria");
}

export async function getProductCategoriesService(
  idBusiness: number,
): Promise<ProductCategoryResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_product_categories(?)",
    [idBusiness],
  );

  const result = rows as unknown as ProductCategoryDbRow[][];
  return (result[0] ?? []).map(mapProductCategory);
}

export async function getProductCategoryByIdService(
  idBusiness: number,
  idProductCategory: number,
): Promise<ProductCategoryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_product_category_by_id(?, ?)",
    [idBusiness, idProductCategory],
  );

  const result = rows as unknown as ProductCategoryDbRow[][];
  const productCategory = result[0]?.[0];

  if (!productCategory) {
    throw new Error("Categoria no encontrada");
  }

  return mapProductCategory(productCategory);
}

export async function updateProductCategoryService(
  idBusiness: number,
  idProductCategory: number,
  data: UpdateProductCategoryBody,
): Promise<ProductCategoryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_product_category(?, ?, ?, ?, ?, ?, ?)",
    [
      idBusiness,
      idProductCategory,
      data.name ?? null,
      data.description ?? null,
      Object.hasOwn(data, "description") ? 1 : 0,
      data.isDefault === undefined ? null : data.isDefault ? 1 : 0,
      Object.hasOwn(data, "isDefault") ? 1 : 0,
    ],
  );

  const result = rows as unknown as ProductCategoryDbRow[][];
  const productCategory = result[0]?.[0];

  if (!productCategory) {
    throw new Error("Categoria no encontrada");
  }

  return mapProductCategory(productCategory);
}

export async function updateProductCategoryStatusService(
  idBusiness: number,
  idProductCategory: number,
  isActive: boolean,
): Promise<ProductCategoryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_product_category_status(?, ?, ?)",
    [idBusiness, idProductCategory, isActive ? 1 : 0],
  );

  const result = rows as unknown as ProductCategoryDbRow[][];
  const productCategory = result[0]?.[0];

  if (!productCategory) {
    throw new Error("Categoria no encontrada");
  }

  return mapProductCategory(productCategory);
}
