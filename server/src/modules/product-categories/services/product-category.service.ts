import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapProductCategory } from "../helpers/product-category.mapper.js";
import type {
  CreateProductCategoryBody,
  ProductCategoryDbRow,
  ProductCategoryResponse,
  UpdateProductCategoryBody,
} from "../types/product-category.types.js";

export async function createProductCategoryService(
  idBusiness: number,
  data: CreateProductCategoryBody,
): Promise<ProductCategoryResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_product_category(?, ?, ?, ?)",
    [
      idBusiness,
      data.name,
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
