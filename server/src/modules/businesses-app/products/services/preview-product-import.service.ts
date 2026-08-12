import { randomUUID } from "node:crypto";
import XLSX from "xlsx";
import { z } from "zod";
import { securityConfig } from "@/config/security.config.js";
import { pool } from "@/db/db.js";
import { normalizeImportHeader } from "../helpers/normalize-import-header.js";
import { normalizeImportValue } from "../helpers/normalize-import-value.js";
import { parseImportBoolean } from "../helpers/parse-import-boolean.js";
import { parseImportDecimal } from "../helpers/parse-import-decimal.js";
import { parseImportUnitType } from "../helpers/parse-import-unit-type.js";
import { productImportRowSchema } from "../validations/product-import.validation.js";
import type {
  ExistingProductRow,
  ImportCacheData,
  LookupRow,
  ProductImportError,
  ProductImportAction,
  ProductImportIdentitySource,
  ProductImportPreviewResponse,
  ProductImportRawRow,
  ProductImportResolvedRow,
  StockLookupRow,
} from "../types/product-import.types.js";

const IMPORT_TOKEN_TTL_MS = 15 * 60 * 1000;
const importCache = new Map<string, ImportCacheData>();

function normalizeLookupKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function createImportToken(): string {
  return `imp_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function cleanupExpiredImportTokens(): void {
  const now = Date.now();

  for (const [token, data] of importCache.entries()) {
    if (data.expiresAt <= now) {
      importCache.delete(token);
    }
  }
}

function getCell(row: Record<string, unknown>, field: string): unknown {
  return row[field] ?? "";
}

function createParseError(
  rowNumber: number,
  field: string,
  value: unknown,
  message: string,
): ProductImportError {
  return {
    rowNumber,
    field,
    value,
    code: "INVALID_VALUE",
    message,
  };
}

function mapZodIssues(
  rowNumber: number,
  row: ProductImportRawRow,
  error: z.ZodError,
): ProductImportError[] {
  return error.issues.map(function mapIssue(issue) {
    const field = issue.path.join(".");
    return {
      rowNumber,
      field,
      value: row[field as keyof ProductImportRawRow] ?? null,
      code: "VALIDATION_ERROR",
      message: issue.message,
    };
  });
}

function parseRawRow(
  rowNumber: number,
  row: Record<string, unknown>,
): { data: ProductImportRawRow | null; errors: ProductImportError[] } {
  const errors: ProductImportError[] = [];
  let priceCost = 0;
  let priceSale = 0;
  let priceWholesale: number | null = null;
  let stockMin = 0;
  let initialStock = 0;

  try {
    priceCost = parseImportDecimal(getCell(row, "priceCost"));
  } catch {
    errors.push(
      createParseError(rowNumber, "priceCost", getCell(row, "priceCost"), "El precio de costo no es valido"),
    );
  }

  try {
    priceSale = parseImportDecimal(getCell(row, "priceSale"));
  } catch {
    errors.push(
      createParseError(rowNumber, "priceSale", getCell(row, "priceSale"), "El precio de venta no es valido"),
    );
  }

  try {
    const value = normalizeImportValue(getCell(row, "priceWholesale"));
    priceWholesale = value ? parseImportDecimal(value) : null;
  } catch {
    errors.push(
      createParseError(rowNumber, "priceWholesale", getCell(row, "priceWholesale"), "El precio mayorista no es valido"),
    );
  }

  try {
    stockMin = parseImportDecimal(getCell(row, "stockMin"));
  } catch {
    errors.push(
      createParseError(rowNumber, "stockMin", getCell(row, "stockMin"), "El stock minimo no es valido"),
    );
  }

  try {
    initialStock = parseImportDecimal(getCell(row, "initialStock"));
  } catch {
    errors.push(
      createParseError(rowNumber, "initialStock", getCell(row, "initialStock"), "El stock inicial no es valido"),
    );
  }

  const rawRow: ProductImportRawRow = {
    rowNumber,
    barcode: normalizeImportValue(getCell(row, "barcode")) || null,
    name: normalizeImportValue(getCell(row, "name")),
    description: normalizeImportValue(getCell(row, "description")) || null,
    imageUrl: normalizeImportValue(getCell(row, "imageUrl")) || null,
    categoryName: normalizeImportValue(getCell(row, "categoryName")),
    depositName: normalizeImportValue(getCell(row, "depositName")),
    priceCost,
    priceSale,
    priceWholesale,
    unitType: parseImportUnitType(getCell(row, "unitType")),
    stockMin,
    initialStock,
    isActive: parseImportBoolean(getCell(row, "isActive"), true),
  };

  const validation = productImportRowSchema.safeParse(rawRow);
  let data: ProductImportRawRow | null = null;

  if (!validation.success) {
    errors.push(...mapZodIssues(rowNumber, rawRow, validation.error));
  } else {
    data = validation.data;
  }

  return {
    data: errors.length > 0 ? null : data,
    errors,
  };
}

function normalizeSheetRows(worksheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) {
    return [];
  }

  if (matrix.length - 1 > securityConfig.importMaxRows) {
    throw new Error("IMPORT_ROW_LIMIT_EXCEEDED");
  }

  const header = matrix[0].map(function mapHeader(value) {
    return normalizeImportHeader(value);
  });
  const filledHeader = header.filter(function filterHeader(key) {
    return Boolean(key);
  });

  if (filledHeader.length > securityConfig.importMaxColumns) {
    throw new Error("IMPORT_COLUMN_LIMIT_EXCEEDED");
  }

  const rows: Record<string, unknown>[] = [];

  for (let index = 1; index < matrix.length; index += 1) {
    const values = matrix[index];
    const row: Record<string, unknown> = {};
    let hasValue = false;

    for (let columnIndex = 0; columnIndex < header.length; columnIndex += 1) {
      const key = header[columnIndex];

      if (!key) {
        continue;
      }

      row[key] = values[columnIndex] ?? "";

      if (
        typeof row[key] === "string" &&
        row[key].length > securityConfig.importMaxCellLength
      ) {
        throw new Error("IMPORT_CELL_LIMIT_EXCEEDED");
      }

      if (normalizeImportValue(row[key])) {
        hasValue = true;
      }
    }

    if (hasValue) {
      row.rowNumber = index + 1;
      rows.push(row);
    }
  }

  return rows;
}

async function getLookupMap(
  table: "product_categories" | "deposits",
  idBusiness: number,
): Promise<Map<string, number>> {
  const idColumn =
    table === "product_categories" ? "idProductCategory" : "idDeposit";
  const [rows] = await pool.query<LookupRow[]>(
    `SELECT ${idColumn} AS id, name FROM ${table} WHERE idBusiness = ? AND is_active = 1`,
    [idBusiness],
  );
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(normalizeLookupKey(row.name), row.id);
  }

  return map;
}

async function getExistingProductsMap(
  idBusiness: number,
  barcodes: string[],
): Promise<Map<string, ExistingProductRow>> {
  if (barcodes.length === 0) {
    return new Map<string, ExistingProductRow>();
  }

  const placeholders = barcodes.map(function createPlaceholder() {
    return "?";
  }).join(",");
  const [rows] = await pool.query<ExistingProductRow[]>(
    `SELECT idProduct, barcode, name, unit_type, is_active FROM products WHERE idBusiness = ? AND barcode IN (${placeholders})`,
    [idBusiness, ...barcodes],
  );
  const map = new Map<string, ExistingProductRow>();

  for (const row of rows) {
    if (row.barcode) {
      map.set(row.barcode, row);
    }
  }

  return map;
}

async function getExistingProductsByNormalizedNameMap(
  idBusiness: number,
  normalizedNames: string[],
): Promise<Map<string, ExistingProductRow[]>> {
  if (normalizedNames.length === 0) {
    return new Map<string, ExistingProductRow[]>();
  }

  const normalizedNameSet = new Set(normalizedNames);
  const [rows] = await pool.query<ExistingProductRow[]>(
    `SELECT idProduct, barcode, name, unit_type, is_active
     FROM products
     WHERE idBusiness = ?`,
    [idBusiness],
  );
  const map = new Map<string, ExistingProductRow[]>();

  for (const row of rows) {
    const normalizedName = normalizeLookupKey(row.name);

    if (!normalizedNameSet.has(normalizedName)) {
      continue;
    }

    const currentRows = map.get(normalizedName) ?? [];
    currentRows.push(row);
    map.set(normalizedName, currentRows);
  }

  return map;
}

async function getExistingStockMap(
  idBusiness: number,
  productIds: number[],
): Promise<Map<string, StockLookupRow>> {
  const uniqueProductIds = Array.from(new Set(productIds));

  if (uniqueProductIds.length === 0) {
    return new Map<string, StockLookupRow>();
  }

  const placeholders = uniqueProductIds.map(function createPlaceholder() {
    return "?";
  }).join(",");
  const [rows] = await pool.query<StockLookupRow[]>(
    `SELECT idStock, idProduct, idDeposit, quantity
     FROM stock
     WHERE idBusiness = ? AND idProduct IN (${placeholders})`,
    [idBusiness, ...uniqueProductIds],
  );
  const map = new Map<string, StockLookupRow>();

  for (const row of rows) {
    map.set(`${row.idProduct}:${row.idDeposit}`, row);
  }

  return map;
}

function addError(errors: ProductImportError[], error: ProductImportError): void {
  errors.push(error);
}

function getProductIdentityKey(
  source: ProductImportIdentitySource,
  existingProductId: number | null,
  normalizedName: string,
  barcode: string | null,
): string {
  if (existingProductId) {
    return `product:${existingProductId}`;
  }

  if (source === "BARCODE" && barcode) {
    return `barcode:${barcode}`;
  }

  return `name:${normalizedName}`;
}

function getPreviewAction(input: {
  existingProductId: number | null;
  existingStockId: number | null;
  existingProductIsActive: boolean | null;
}): ProductImportAction {
  if (!input.existingProductId) {
    return "CREATE_PRODUCT";
  }

  if (input.existingStockId) {
    return "ADD_STOCK";
  }

  if (input.existingProductIsActive === false) {
    return "UPDATE_PRODUCT";
  }

  return "CREATE_STOCK";
}

function createInvalidResolvedRow(
  row: ProductImportRawRow,
  categoryId: number | undefined,
  depositId: number | undefined,
  existingProduct: ExistingProductRow | null,
  productIdentityKey: string,
  identitySource: ProductImportIdentitySource,
  warnings: string[],
): ProductImportResolvedRow {
  return {
    ...row,
    idProductCategory: categoryId ?? 0,
    idDeposit: depositId ?? 0,
    existingProductId: existingProduct?.idProduct ?? null,
    existingProductIsActive: existingProduct
      ? Boolean(existingProduct.is_active)
      : null,
    existingStockId: null,
    existingStockQuantity: null,
    resultingStockQuantity: null,
    productIdentityKey,
    identitySource,
    action: "SKIP",
    status: "INVALID",
    warnings,
  };
}

export function getProductImportCacheData(
  importToken: string,
): ImportCacheData | null {
  cleanupExpiredImportTokens();
  return importCache.get(importToken) ?? null;
}

export function deleteProductImportCacheData(importToken: string): void {
  importCache.delete(importToken);
}

export async function previewProductImportService(
  idBusiness: number,
  idUser: number,
  file: Express.Multer.File,
): Promise<ProductImportPreviewResponse> {
  cleanupExpiredImportTokens();

  if (!file.buffer || file.buffer.length === 0) {
    throw new Error("INVALID_IMPORT_FILE");
  }

  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(file.buffer, {
      type: "buffer",
      cellDates: false,
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
    });
  } catch {
    throw new Error("INVALID_IMPORT_FILE");
  }

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("INVALID_IMPORT_FILE");
  }

  const rows = normalizeSheetRows(workbook.Sheets[firstSheetName]);

  const categoryMap = await getLookupMap("product_categories", idBusiness);
  const depositMap = await getLookupMap("deposits", idBusiness);
  const parsedRows: ProductImportRawRow[] = [];
  const errors: ProductImportError[] = [];
  const barcodeCounter = new Map<string, number>();
  const stockIdentityCounter = new Map<string, number>();

  for (const row of rows) {
    const rowNumber = Number(row.rowNumber);
    const result = parseRawRow(rowNumber, row);

    if (!result.data) {
      errors.push(...result.errors);
      continue;
    }

    parsedRows.push(result.data);

    if (result.data.barcode) {
      barcodeCounter.set(
        result.data.barcode,
        (barcodeCounter.get(result.data.barcode) ?? 0) + 1,
      );
    }
  }

  for (const row of parsedRows) {
    const depositId = depositMap.get(normalizeLookupKey(row.depositName));

    if (row.barcode || !depositId) {
      continue;
    }

    const stockIdentityKey = `${normalizeLookupKey(row.name)}:${depositId}`;
    stockIdentityCounter.set(
      stockIdentityKey,
      (stockIdentityCounter.get(stockIdentityKey) ?? 0) + 1,
    );
  }

  const uniqueBarcodes = Array.from(new Set(parsedRows.map(function mapBarcode(row) {
    return row.barcode;
  }).filter(function filterBarcode(barcode): barcode is string {
    return Boolean(barcode);
  })));
  const uniqueNamesWithoutBarcode = Array.from(new Set(parsedRows.filter(function filterRow(row) {
    return !row.barcode;
  }).map(function mapName(row) {
    return normalizeLookupKey(row.name);
  })));
  const existingProductMap = await getExistingProductsMap(idBusiness, uniqueBarcodes);
  const existingProductByNameMap = await getExistingProductsByNormalizedNameMap(
    idBusiness,
    uniqueNamesWithoutBarcode,
  );
  const productIdsForStock: number[] = [];

  for (const row of parsedRows) {
    if (row.barcode) {
      const productByBarcode = existingProductMap.get(row.barcode);

      if (productByBarcode) {
        productIdsForStock.push(productByBarcode.idProduct);
      }

      continue;
    }

    const productsByName = existingProductByNameMap.get(normalizeLookupKey(row.name)) ?? [];

    if (productsByName.length === 1) {
      productIdsForStock.push(productsByName[0].idProduct);
    }
  }

  const existingStockMap = await getExistingStockMap(idBusiness, productIdsForStock);
  const resolvedRows: ProductImportResolvedRow[] = [];

  for (const row of parsedRows) {
    const rowErrors: ProductImportError[] = [];
    const rowWarnings: string[] = [];
    const categoryId = categoryMap.get(normalizeLookupKey(row.categoryName));
    const depositId = depositMap.get(normalizeLookupKey(row.depositName));
    const normalizedName = normalizeLookupKey(row.name);
    const productNameMatches = row.barcode
      ? []
      : existingProductByNameMap.get(normalizedName) ?? [];
    let existingProduct = row.barcode
      ? existingProductMap.get(row.barcode) ?? null
      : productNameMatches.length === 1
        ? productNameMatches[0]
        : null;
    const existingProductId = existingProduct?.idProduct ?? null;
    const isInternalDuplicate = row.barcode
      ? (barcodeCounter.get(row.barcode) ?? 0) > 1
      : depositId
        ? (stockIdentityCounter.get(`${normalizedName}:${depositId}`) ?? 0) > 1
        : false;
    let identitySource: ProductImportIdentitySource = row.barcode
      ? "BARCODE"
      : existingProduct
        ? "NAME"
        : "FILE_NAME";
    let productIdentityKey = getProductIdentityKey(
      identitySource,
      existingProductId,
      normalizedName,
      row.barcode,
    );

    if (!categoryId) {
      addError(rowErrors, {
        rowNumber: row.rowNumber,
        field: "categoryName",
        value: row.categoryName,
        code: "CATEGORY_NOT_FOUND",
        message: `La categoria '${row.categoryName}' no existe o esta inactiva en su comercio`,
      });
    }

    if (!depositId) {
      addError(rowErrors, {
        rowNumber: row.rowNumber,
        field: "depositName",
        value: row.depositName,
        code: "DEPOSIT_NOT_FOUND",
        message: `El deposito '${row.depositName}' no existe o esta inactivo en su comercio`,
      });
    }

    if (!row.barcode && productNameMatches.length > 1) {
      addError(rowErrors, {
        rowNumber: row.rowNumber,
        field: "name",
        value: row.name,
        code: "AMBIGUOUS_PRODUCT_NAME",
        message: `Hay mas de un producto con nombre equivalente a '${row.name}'. Revise la fila manualmente.`,
      });
      existingProduct = null;
      identitySource = "FILE_NAME";
      productIdentityKey = getProductIdentityKey(
        identitySource,
        null,
        normalizedName,
        row.barcode,
      );
    }

    if (!row.barcode && existingProduct && existingProduct.unit_type !== row.unitType) {
      addError(rowErrors, {
        rowNumber: row.rowNumber,
        field: "unitType",
        value: row.unitType,
        code: "UNIT_TYPE_CONFLICT",
        message: `Producto encontrado por nombre, pero la unidad actual es '${existingProduct.unit_type}' y el Excel indica '${row.unitType}'.`,
      });
    }

    if (isInternalDuplicate) {
      addError(rowErrors, {
        rowNumber: row.rowNumber,
        field: row.barcode ? "barcode" : "name",
        value: row.barcode ?? row.name,
        code: "DUPLICATE_IN_FILE",
        message: row.barcode
          ? `El codigo de barras '${row.barcode}' se repite dentro del archivo`
          : `El producto '${row.name}' se repite para el mismo deposito dentro del archivo`,
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      resolvedRows.push(
        isInternalDuplicate
          ? {
              ...row,
              idProductCategory: categoryId ?? 0,
              idDeposit: depositId ?? 0,
              existingProductId,
              existingProductIsActive: existingProduct
                ? Boolean(existingProduct.is_active)
                : null,
              existingStockId: null,
              existingStockQuantity: null,
              resultingStockQuantity: null,
              productIdentityKey,
              identitySource,
              action: "SKIP",
              status: "DUPLICATE",
              warnings: rowWarnings,
            }
          : createInvalidResolvedRow(
              row,
              categoryId,
              depositId,
              existingProduct,
              productIdentityKey,
              identitySource,
              rowWarnings,
            ),
      );
      continue;
    }

    const stockKey = existingProductId && depositId
      ? `${existingProductId}:${depositId}`
      : "";
    const existingStock = stockKey ? existingStockMap.get(stockKey) ?? null : null;
    const existingStockQuantity = existingStock
      ? Number(existingStock.quantity)
      : null;
    const resultingStockQuantity = existingStockQuantity === null
      ? row.initialStock
      : existingStockQuantity + row.initialStock;
    const action = getPreviewAction({
      existingProductId,
      existingStockId: existingStock?.idStock ?? null,
      existingProductIsActive: existingProduct
        ? Boolean(existingProduct.is_active)
        : null,
    });

    if (existingProductId && existingStock) {
      rowWarnings.push(
        "Este producto ya tiene stock en el deposito. Por defecto no se modificara; puede elegir sumar la cantidad del Excel.",
      );
    } else if (existingProductId) {
      rowWarnings.push(
        "Se utilizara el producto existente y se creara stock en el deposito indicado.",
      );
    }

    resolvedRows.push({
      ...row,
      idProductCategory: categoryId ?? 0,
      idDeposit: depositId ?? 0,
      existingProductId,
      existingProductIsActive: existingProduct
        ? Boolean(existingProduct.is_active)
        : null,
      existingStockId: existingStock?.idStock ?? null,
      existingStockQuantity,
      resultingStockQuantity,
      productIdentityKey,
      identitySource,
      action,
      status: "VALID",
      warnings: rowWarnings,
    });
  }

  const importToken = createImportToken();
  const validRows = resolvedRows.filter(function filterValid(row) {
    return row.status === "VALID";
  }).length;
  const invalidRows = resolvedRows.filter(function filterInvalid(row) {
    return row.status === "INVALID";
  }).length;
  const warningRows = resolvedRows.filter(function filterWarning(row) {
    return row.status === "WARNING" || row.warnings.length > 0;
  }).length;
  const duplicateRows = resolvedRows.filter(function filterDuplicate(row) {
    return row.status === "DUPLICATE";
  }).length;
  const newProducts = new Set(resolvedRows.filter(function filterNew(row) {
    return row.status === "VALID" && row.action === "CREATE_PRODUCT";
  }).map(function mapKey(row) {
    return row.productIdentityKey;
  })).size;
  const existingProductsNewDeposit = resolvedRows.filter(function filterStock(row) {
    return row.status === "VALID" && row.action === "CREATE_STOCK";
  }).length;
  const existingStockRows = resolvedRows.filter(function filterExistingStock(row) {
    return row.status === "VALID" && row.existingStockId !== null;
  }).length;
  const preview: ProductImportPreviewResponse = {
    importToken,
    fileName: file.originalname,
    totalRows: rows.length,
    validRows,
    warningRows,
    invalidRows,
    duplicateRows,
    newProducts,
    existingProductsNewDeposit,
    existingStockRows,
    rows: resolvedRows,
    errors,
  };

  importCache.set(importToken, {
    idBusiness,
    idUser,
    fileName: file.originalname,
    expiresAt: Date.now() + IMPORT_TOKEN_TTL_MS,
    preview,
  });

  return preview;
}
