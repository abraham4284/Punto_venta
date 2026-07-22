import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { ProductUnitType } from "./index.js";

export type ProductImportRowStatus = "VALID" | "INVALID" | "DUPLICATE";

export type ProductImportMode = "CREATE_ONLY" | "UPDATE_EXISTING";

export interface ProductImportRawRow {
  rowNumber: number;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryName: string;
  depositName: string;
  priceCost: number;
  priceSale: number;
  priceWholesale: number | null;
  unitType: ProductUnitType;
  stockMin: number;
  initialStock: number;
  isActive: boolean;
}

export interface ProductImportResolvedRow extends ProductImportRawRow {
  idProductCategory: number;
  idDeposit: number;
  existingProductId: number | null;
  status: ProductImportRowStatus;
  warnings: string[];
}

export interface ProductImportError {
  rowNumber: number;
  field: string;
  value: unknown;
  code: string;
  message: string;
}

export interface ProductImportPreviewResponse {
  importToken: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: ProductImportResolvedRow[];
  errors: ProductImportError[];
}

export interface ProductImportConfirmInput {
  idBusiness: number;
  idUser: number;
  importToken: string;
  importMode: ProductImportMode;
  importValidRowsOnly: boolean;
}

export interface ProductImportConfirmResponse {
  totalRows: number;
  createdProducts: number;
  updatedProducts: number;
  skippedRows: number;
  stockRecordsCreated: number;
  stockMovementsCreated: number;
  errors: ProductImportError[];
  warnings: string[];
}

export interface ImportCacheData {
  idBusiness: number;
  idUser: number;
  fileName: string;
  expiresAt: number;
  preview: ProductImportPreviewResponse;
}

export interface LookupRow extends RowDataPacket {
  id: number;
  name: string;
}

export interface ExistingProductRow extends RowDataPacket {
  idProduct: number;
  barcode: string;
}

export interface StockLookupRow extends RowDataPacket {
  idStock: number;
}

export type DbResult = ResultSetHeader;
