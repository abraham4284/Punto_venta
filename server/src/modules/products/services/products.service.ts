import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";
import { mapProduct } from "../helpers/product.mapper.js";
import type {
  CreateProductPayload,
  ProductDbRow,
  ProductResponse,
  ToggleProductStatusPayload,
  UpdateProductPayload,
} from "../types/index.js";

export async function createProductService(
  data: CreateProductPayload,
): Promise<ProductResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_create_product(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idProductCategory,
      data.idDeposit,
      data.stock,
      data.barcode ?? null,
      data.name,
      data.description ?? null,
      data.imageUrl ?? null,
      data.priceCost,
      data.priceSale,
      data.priceWholesale ?? null,
      data.stockMin ?? 0,
    ],
  );

  const result = rows as unknown as ProductDbRow[][];
  const product = result[0]?.[0];

  if (!product) {
    throw new Error("No se pudo crear el producto");
  }

  return mapProduct(product);
}

export async function getProductsService(
  idBusiness: number,
): Promise<ProductResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>("CALL sp_get_products(?)", [
    idBusiness,
  ]);

  const result = rows as unknown as ProductDbRow[][];
  return (result[0] ?? []).map(mapProduct);
}

export async function getProductByIdService(
  idBusiness: number,
  idProduct: number,
): Promise<ProductResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_product_by_id(?, ?)",
    [idBusiness, idProduct],
  );

  const result = rows as unknown as ProductDbRow[][];
  const product = result[0]?.[0];

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  return mapProduct(product);
}

export async function updateProductService(
  data: UpdateProductPayload,
): Promise<ProductResponse> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_update_product(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
      data.imageUrl ?? null,
      Object.hasOwn(data, "imageUrl") ? 1 : 0,
      data.priceCost ?? null,
      data.priceSale ?? null,
      data.priceWholesale ?? null,
      Object.hasOwn(data, "priceWholesale") ? 1 : 0,
      data.stockMin ?? null,
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
