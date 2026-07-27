import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  deleteProductImportCacheData,
  getProductImportCacheData,
} from "./preview-product-import.service.js";
import { pool } from "@/db/db.js";
import { assertSubscriptionResourceAvailable } from "@/modules/businesses-app/subscription/services/subscription-limits.service.js";
import type {
  ProductImportConfirmInput,
  ProductImportConfirmResponse,
  ProductImportError,
  ProductImportResolvedRow,
  StockLookupRow,
} from "../types/product-import.types.js";

interface ImportSubscriptionLimitRow extends RowDataPacket {
  idBusinessSubscription: number;
  maxProducts: number | null;
}

interface ImportCountRow extends RowDataPacket {
  currentUsage: number;
}

function hasRowError(
  errors: ProductImportError[],
  rowNumber: number,
  code: string,
): boolean {
  return errors.some(function matchError(error) {
    return error.rowNumber === rowNumber && error.code === code;
  });
}

function shouldImportRow(
  row: ProductImportResolvedRow,
  input: ProductImportConfirmInput,
  errors: ProductImportError[],
): boolean {
  if (row.status === "INVALID") {
    return false;
  }

  if (input.importValidRowsOnly && row.status !== "VALID") {
    return false;
  }

  if (row.status === "VALID") {
    return true;
  }

  if (input.importMode !== "UPDATE_EXISTING") {
    return false;
  }

  if (!row.existingProductId) {
    return false;
  }

  return !hasRowError(errors, row.rowNumber, "DUPLICATE_IN_FILE");
}

function consumesProductLimit(row: ProductImportResolvedRow): boolean {
  if (!row.isActive) {
    return false;
  }

  if (!row.existingProductId) {
    return true;
  }

  return row.existingProductIsActive === false;
}

function countProductsThatConsumeLimit(
  rows: ProductImportResolvedRow[],
  input: ProductImportConfirmInput,
  errors: ProductImportError[],
): number {
  return rows.filter(function filterRow(row) {
    return shouldImportRow(row, input, errors) && consumesProductLimit(row);
  }).length;
}

async function createProduct(
  connection: PoolConnection,
  idBusiness: number,
  row: ProductImportResolvedRow,
): Promise<number> {
  const [result] = await connection.query<ResultSetHeader>(
    `INSERT INTO products (
      idBusiness,
      idProductCategory,
      barcode,
      name,
      description,
      image_url,
      price_cost,
      price_sale,
      price_wholesale,
      unit_type,
      stock_min,
      is_active,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      idBusiness,
      row.idProductCategory,
      row.barcode,
      row.name,
      row.description,
      row.imageUrl,
      row.priceCost,
      row.priceSale,
      row.priceWholesale,
      row.unitType,
      row.stockMin,
      row.isActive ? 1 : 0,
    ],
  );

  return result.insertId;
}

async function assertProductImportLimitInsideTransaction(
  connection: PoolConnection,
  idBusiness: number,
  requestedAmount: number,
): Promise<void> {
  if (requestedAmount < 1) return;

  const [subscriptionRows] = await connection.query<ImportSubscriptionLimitRow[]>(
    `SELECT bs.idBusinessSubscription, sp.max_products AS maxProducts
     FROM business_subscriptions bs
     INNER JOIN subscription_plans sp
       ON sp.idSubscriptionPlan = bs.idSubscriptionPlan
     WHERE bs.idBusiness = ?
       AND bs.status IN ('TRIAL','ACTIVE','PAST_DUE')
     ORDER BY bs.created_at DESC, bs.idBusinessSubscription DESC
     LIMIT 1
     FOR UPDATE`,
    [idBusiness],
  );

  const subscription = subscriptionRows[0];

  if (!subscription) {
    throw new Error("SUBSCRIPTION_REQUIRED");
  }

  if (subscription.maxProducts === null) {
    return;
  }

  const [countRows] = await connection.query<ImportCountRow[]>(
    `SELECT COUNT(*) AS currentUsage
     FROM products
     WHERE idBusiness = ?
       AND is_active = 1`,
    [idBusiness],
  );

  const currentUsage = countRows[0]?.currentUsage ?? 0;

  if (currentUsage + requestedAmount > subscription.maxProducts) {
    throw new Error("SUBSCRIPTION_PRODUCT_LIMIT_REACHED");
  }
}

async function updateProduct(
  connection: PoolConnection,
  idBusiness: number,
  idProduct: number,
  row: ProductImportResolvedRow,
): Promise<void> {
  await connection.query(
    `UPDATE products
     SET
      idProductCategory = ?,
      name = ?,
      description = ?,
      image_url = ?,
      price_cost = ?,
      price_sale = ?,
      price_wholesale = ?,
      unit_type = ?,
      stock_min = ?,
      is_active = ?,
      updated_at = NOW()
     WHERE idBusiness = ? AND idProduct = ?`,
    [
      row.idProductCategory,
      row.name,
      row.description,
      row.imageUrl,
      row.priceCost,
      row.priceSale,
      row.priceWholesale,
      row.unitType,
      row.stockMin,
      row.isActive ? 1 : 0,
      idBusiness,
      idProduct,
    ],
  );
}

async function upsertStock(
  connection: PoolConnection,
  idBusiness: number,
  idProduct: number,
  row: ProductImportResolvedRow,
): Promise<boolean> {
  const [rows] = await connection.query<StockLookupRow[]>(
    `SELECT idStock
     FROM stock
     WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?
     LIMIT 1`,
    [idBusiness, idProduct, row.idDeposit],
  );

  if (rows[0]) {
    await connection.query(
      `UPDATE stock
       SET quantity = ?, updated_at = NOW()
       WHERE idBusiness = ? AND idProduct = ? AND idDeposit = ?`,
      [row.initialStock, idBusiness, idProduct, row.idDeposit],
    );
    return false;
  }

  await connection.query(
    `INSERT INTO stock (
      idBusiness,
      idProduct,
      idDeposit,
      quantity,
      updated_at
    ) VALUES (?, ?, ?, ?, NOW())`,
    [idBusiness, idProduct, row.idDeposit, row.initialStock],
  );
  return true;
}

async function createStockMovement(
  connection: PoolConnection,
  idBusiness: number,
  idUser: number,
  idProduct: number,
  row: ProductImportResolvedRow,
): Promise<void> {
  await connection.query(
    `INSERT INTO stock_movements (
      idBusiness,
      idProduct,
      idUser,
      movement_type,
      idDepositFrom,
      idDepositTo,
      quantity,
      reference_type,
      reference_id,
      observation,
      created_at
    ) VALUES (?, ?, ?, 'ADJUSTMENT_IN', NULL, ?, ?, 'ADJUSTMENT', ?, ?, NOW())`,
    [
      idBusiness,
      idProduct,
      idUser,
      row.idDeposit,
      row.initialStock,
      idProduct,
      `Importacion masiva de producto ${row.barcode ?? row.name}`,
    ],
  );
}

export async function confirmProductImportService(
  input: ProductImportConfirmInput,
): Promise<ProductImportConfirmResponse> {
  const cachedData = getProductImportCacheData(input.importToken);

  if (
    !cachedData ||
    cachedData.idBusiness !== input.idBusiness ||
    cachedData.idUser !== input.idUser
  ) {
    throw new Error("La importacion expiro o no pertenece a la sesion actual");
  }

  const connection = await pool.getConnection();
  const response: ProductImportConfirmResponse = {
    totalRows: cachedData.preview.totalRows,
    createdProducts: 0,
    updatedProducts: 0,
    skippedRows: 0,
    stockRecordsCreated: 0,
    stockMovementsCreated: 0,
    errors: [],
    warnings: [],
  };

  try {
    const productsToCreateOrReactivate = countProductsThatConsumeLimit(
      cachedData.preview.rows,
      input,
      cachedData.preview.errors,
    );

    if (productsToCreateOrReactivate > 0) {
      await assertSubscriptionResourceAvailable(
        input.idBusiness,
        "PRODUCTS",
        productsToCreateOrReactivate,
      );
    }

    await connection.beginTransaction();
    await assertProductImportLimitInsideTransaction(
      connection,
      input.idBusiness,
      productsToCreateOrReactivate,
    );

    for (const row of cachedData.preview.rows) {
      if (!shouldImportRow(row, input, cachedData.preview.errors)) {
        response.skippedRows += 1;
        continue;
      }

      let idProduct = row.existingProductId;

      if (idProduct && input.importMode === "UPDATE_EXISTING") {
        await updateProduct(connection, input.idBusiness, idProduct, row);
        response.updatedProducts += 1;
      } else {
        idProduct = await createProduct(connection, input.idBusiness, row);
        response.createdProducts += 1;
      }

      const stockWasCreated = await upsertStock(
        connection,
        input.idBusiness,
        idProduct,
        row,
      );

      if (stockWasCreated) {
        response.stockRecordsCreated += 1;
      }

      if (row.initialStock > 0) {
        await createStockMovement(
          connection,
          input.idBusiness,
          input.idUser,
          idProduct,
          row,
        );
        response.stockMovementsCreated += 1;
      }
    }

    await connection.commit();
    deleteProductImportCacheData(input.importToken);
    return response;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
