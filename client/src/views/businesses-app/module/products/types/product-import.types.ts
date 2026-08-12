import type { ProductUnitType } from "./products.types";

export type ProductImportStatus = "VALID" | "WARNING" | "INVALID" | "DUPLICATE";

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

export type ProductImportPreviewFilter =
  | "ALL"
  | "VALID"
  | "WARNING"
  | "INVALID"
  | "DUPLICATE";

export interface ProductImportPreviewRow {
  rowNumber: number;
  status: ProductImportStatus;
  action: ProductImportAction;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryName: string;
  depositName: string;
  idProductCategory: number | null;
  idDeposit: number | null;
  priceCost: number;
  priceSale: number;
  priceWholesale: number | null;
  unitType: ProductUnitType;
  stockMin: number;
  initialStock: number;
  isActive: boolean;
  existingProductId: number | null;
  existingStockId: number | null;
  existingStockQuantity: number | null;
  resultingStockQuantity: number | null;
  errors: string[];
  warnings: string[];
}

export interface ProductImportPreviewSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateRows: number;
  newProducts: number;
  existingProductsNewDeposit: number;
  existingStockRows: number;
}

export interface ProductImportPreviewResponse {
  importToken: string;
  expiresAt: string;
  summary: ProductImportPreviewSummary;
  rows: ProductImportPreviewRow[];
}

export interface ConfirmProductImportPayload {
  importToken: string;
  importMode: ProductImportMode;
  existingStockMode: ExistingStockImportMode;
  importValidRowsOnly: boolean;
}

export interface ProductImportResult {
  created: number;
  updated: number;
  skipped: number;
  stockRowsAffected: number;
  stockRowsUpdated: number;
  stockQuantityAdded: number;
  movementsCreated: number;
  errors: string[];
  warnings: string[];
}

export interface ProductImportApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}
