import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { ProductUnitType } from "./index.js";

export type ProductImportRowStatus = "VALID" | "WARNING" | "INVALID" | "DUPLICATE";

export type ProductImportMode = "CREATE_ONLY" | "UPDATE_EXISTING";

export type ExistingStockImportMode =
  | "SKIP_EXISTING_STOCK"
  | "ADD_TO_EXISTING_STOCK";

export type ProductImportAction =
  | "CREATE_PRODUCT"
  | "CREATE_STOCK"
  | "UPDATE_PRODUCT"
  | "ADD_STOCK"
  | "SKIP";

export type ProductImportIdentitySource = "BARCODE" | "NAME" | "FILE_NAME";

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
  existingProductIsActive: boolean | null;
  existingStockId: number | null;
  existingStockQuantity: number | null;
  resultingStockQuantity: number | null;
  productIdentityKey: string;
  identitySource: ProductImportIdentitySource;
  action: ProductImportAction;
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
  warningRows: number;
  invalidRows: number;
  duplicateRows: number;
  newProducts: number;
  existingProductsNewDeposit: number;
  existingStockRows: number;
  rows: ProductImportResolvedRow[];
  errors: ProductImportError[];
}

export interface ProductImportConfirmInput {
  idBusiness: number;
  idUser: number;
  importToken: string;
  importMode: ProductImportMode;
  existingStockMode: ExistingStockImportMode;
  importValidRowsOnly: boolean;
}

export interface ProductImportConfirmResponse {
  totalRows: number;
  createdProducts: number;
  updatedProducts: number;
  skippedRows: number;
  stockRecordsCreated: number;
  stockRecordsUpdated: number;
  stockQuantityAdded: number;
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
  barcode: string | null;
  name: string;
  unit_type: ProductUnitType;
  is_active: number;
}

export interface ExistingProductStatusRow extends RowDataPacket {
  idProduct: number;
  is_active: number;
}

export interface StockLookupRow extends RowDataPacket {
  idStock: number;
  idProduct: number;
  idDeposit: number;
  quantity: number | string;
}

export type DbResult = ResultSetHeader;
