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
  ProductImportPreviewResponse,
  ProductImportRawRow,
  ProductImportResolvedRow,
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
): Promise<Map<string, { idProduct: number; isActive: boolean }>> {
  if (barcodes.length === 0) {
    return new Map<string, { idProduct: number; isActive: boolean }>();
  }

  const placeholders = barcodes.map(function createPlaceholder() {
    return "?";
  }).join(",");
  const [rows] = await pool.query<ExistingProductRow[]>(
    `SELECT idProduct, barcode, is_active FROM products WHERE idBusiness = ? AND barcode IN (${placeholders})`,
    [idBusiness, ...barcodes],
  );
  const map = new Map<string, { idProduct: number; isActive: boolean }>();

  for (const row of rows) {
    map.set(row.barcode, {
      idProduct: row.idProduct,
      isActive: Boolean(row.is_active),
    });
  }

  return map;
}

function addError(errors: ProductImportError[], error: ProductImportError): void {
  errors.push(error);
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

  const uniqueBarcodes = Array.from(new Set(parsedRows.map(function mapBarcode(row) {
    return row.barcode;
  }).filter(function filterBarcode(barcode): barcode is string {
    return Boolean(barcode);
  })));
  const existingProductMap = await getExistingProductsMap(idBusiness, uniqueBarcodes);
  const resolvedRows: ProductImportResolvedRow[] = [];

  for (const row of parsedRows) {
    const rowErrors: ProductImportError[] = [];
    const categoryId = categoryMap.get(normalizeLookupKey(row.categoryName));
    const depositId = depositMap.get(normalizeLookupKey(row.depositName));
    const existingProduct = row.barcode
      ? existingProductMap.get(row.barcode) ?? null
      : null;
    const existingProductId = existingProduct?.idProduct ?? null;
    const isInternalDuplicate = row.barcode
      ? (barcodeCounter.get(row.barcode) ?? 0) > 1
      : false;

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

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      resolvedRows.push({
        ...row,
        idProductCategory: categoryId ?? 0,
        idDeposit: depositId ?? 0,
        existingProductId,
        existingProductIsActive: existingProduct?.isActive ?? null,
        status: "INVALID",
        warnings: [],
      });
      continue;
    }

    if (isInternalDuplicate) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "barcode",
        value: row.barcode,
        code: "DUPLICATE_IN_FILE",
        message: `El codigo de barras '${row.barcode ?? ""}' se repite dentro del archivo`,
      });
    }

    if (existingProductId) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "barcode",
        value: row.barcode,
        code: "DUPLICATE_IN_DATABASE",
        message: `El codigo de barras '${row.barcode ?? ""}' ya existe en su comercio`,
      });
    }

    resolvedRows.push({
      ...row,
      idProductCategory: categoryId ?? 0,
      idDeposit: depositId ?? 0,
      existingProductId,
      existingProductIsActive: existingProduct?.isActive ?? null,
      status: isInternalDuplicate || existingProductId ? "DUPLICATE" : "VALID",
      warnings: existingProductId
        ? ["Disponible para actualizar usando el modo Actualizar por codigo"]
        : [],
    });
  }

  const importToken = createImportToken();
  const validRows = resolvedRows.filter(function filterValid(row) {
    return row.status === "VALID";
  }).length;
  const invalidRows = resolvedRows.filter(function filterInvalid(row) {
    return row.status === "INVALID";
  }).length;
  const duplicateRows = resolvedRows.filter(function filterDuplicate(row) {
    return row.status === "DUPLICATE";
  }).length;
  const preview: ProductImportPreviewResponse = {
    importToken,
    fileName: file.originalname,
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateRows,
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
