import type { ProductUnitType } from "./products.types";

export type ProductImportStatus = "VALID" | "WARNING" | "INVALID" | "DUPLICATE";

export type ProductImportMode = "CREATE_ONLY" | "UPDATE_EXISTING";

export type ProductImportPreviewFilter =
  | "ALL"
  | "VALID"
  | "WARNING"
  | "INVALID"
  | "DUPLICATE";

export interface ProductImportPreviewRow {
  rowNumber: number;
  status: ProductImportStatus;
  action: "CREATE" | "UPDATE" | "SKIP";
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
  errors: string[];
  warnings: string[];
}

export interface ProductImportPreviewSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateRows: number;
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
  importValidRowsOnly: boolean;
}

export interface ProductImportResult {
  created: number;
  updated: number;
  skipped: number;
  stockRowsAffected: number;
  movementsCreated: number;
  errors: string[];
  warnings: string[];
}

export interface ProductImportApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}
