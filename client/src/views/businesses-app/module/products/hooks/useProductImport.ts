import { useCallback, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { AxiosError } from "axios";
import {
  confirmProductImportRequest,
  downloadProductImportTemplateRequest,
  previewProductImportRequest,
} from "../api/product-import.api";
import type {
  ProductImportMode,
  ProductImportPreviewResponse,
  ProductImportPreviewFilter,
  ProductImportPreviewRow,
  ProductImportResult,
} from "../types/product-import.types";
import type { ApiErrorResponse } from "../types/products.types";

export type ProductImportStep = "UPLOAD" | "PREVIEW" | "CONFIRM" | "RESULT";

const PREVIEW_PAGE_SIZE = 15;

interface RawProductImportError {
  rowNumber: number;
  message: string;
}

interface RawProductImportPreviewRow
  extends Omit<ProductImportPreviewRow, "action" | "errors"> {
  action?: ProductImportPreviewRow["action"];
}

interface RawProductImportPreviewResponse {
  importToken: string;
  fileName?: string;
  expiresAt?: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: RawProductImportPreviewRow[];
  errors?: RawProductImportError[];
}

interface RawProductImportConfirmResponse {
  totalRows: number;
  createdProducts: number;
  updatedProducts: number;
  skippedRows: number;
  stockRecordsCreated: number;
  stockMovementsCreated: number;
  errors?: RawProductImportError[];
  warnings?: string[];
}

const getRowAction = (
  row: RawProductImportPreviewRow,
): ProductImportPreviewRow["action"] => {
  if (row.action) return row.action;
  if (row.status === "VALID") return "CREATE";
  if (row.existingProductId) return "UPDATE";
  return "SKIP";
};

const normalizePreviewResponse = (
  preview: RawProductImportPreviewResponse,
): ProductImportPreviewResponse => {
  const errorMap = new Map<number, string[]>();

  for (const error of preview.errors ?? []) {
    const currentErrors = errorMap.get(error.rowNumber) ?? [];
    currentErrors.push(error.message);
    errorMap.set(error.rowNumber, currentErrors);
  }

  return {
    importToken: preview.importToken,
    expiresAt: preview.expiresAt ?? "",
    summary: {
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      warningRows: 0,
      invalidRows: preview.invalidRows,
      duplicateRows: preview.duplicateRows,
    },
    rows: preview.rows.map((row) => ({
      ...row,
      action: getRowAction(row),
      errors: errorMap.get(row.rowNumber) ?? [],
      warnings: row.warnings ?? [],
    })),
  };
};

const normalizeConfirmResponse = (
  result: RawProductImportConfirmResponse,
): ProductImportResult => {
  return {
    created: result.createdProducts,
    updated: result.updatedProducts,
    skipped: result.skippedRows,
    stockRowsAffected: result.stockRecordsCreated,
    movementsCreated: result.stockMovementsCreated,
    errors: (result.errors ?? []).map((error) => error.message),
    warnings: result.warnings ?? [],
  };
};

export const useProductImport = () => {
  const [step, setStep] = useState<ProductImportStep>("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ProductImportPreviewResponse | null>(
    null,
  );
  const [result, setResult] = useState<ProductImportResult | null>(null);
  const [previewFilter, setPreviewFilter] =
    useState<ProductImportPreviewFilter>("ALL");
  const [previewPage, setPreviewPage] = useState(1);
  const [importMode, setImportMode] =
    useState<ProductImportMode>("CREATE_ONLY");
  const [importValidRowsOnly, setImportValidRowsOnly] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.message || fallback;
  };

  const downloadTemplate = async () => {
    try {
      setLoadingTemplate(true);
      setError(null);

      const response = await downloadProductImportTemplateRequest();
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "plantilla-importacion-productos.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No se pudo descargar la plantilla",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const selectFile = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
    setPreview(null);
    setResult(null);
    setStep("UPLOAD");
  };

  const generatePreview = async () => {
    if (!selectedFile) {
      const message = "Selecciona un archivo Excel para continuar";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setLoadingPreview(true);
      setError(null);

      const response = await previewProductImportRequest(selectedFile);
      setPreview(
        normalizePreviewResponse(
          response.data.data as unknown as RawProductImportPreviewResponse,
        ),
      );
      setPreviewFilter("ALL");
      setPreviewPage(1);
      setStep("PREVIEW");
    } catch (error) {
      const message = getErrorMessage(error, "No se pudo previsualizar el Excel");
      setError(message);
      toast.error(message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const confirmImport = async () => {
    if (!preview?.importToken) {
      const message = "No hay una previsualizacion activa para confirmar";
      setError(message);
      toast.error(message);
      return false;
    }

    try {
      setLoadingConfirm(true);
      setError(null);

      const response = await confirmProductImportRequest({
        importToken: preview.importToken,
        importMode,
        importValidRowsOnly,
      });

      setResult(
        normalizeConfirmResponse(
          response.data.data as unknown as RawProductImportConfirmResponse,
        ),
      );
      setStep("RESULT");
      toast.success(response.data.message);
      return true;
    } catch (error) {
      const message = getErrorMessage(error, "No se pudo confirmar la importacion");
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoadingConfirm(false);
    }
  };

  const resetImport = useCallback(() => {
    setStep("UPLOAD");
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setPreviewFilter("ALL");
    setPreviewPage(1);
    setImportMode("CREATE_ONLY");
    setImportValidRowsOnly(true);
    setLoadingTemplate(false);
    setLoadingPreview(false);
    setLoadingConfirm(false);
    setError(null);
  }, []);

  const filteredPreviewRows = useMemo(() => {
    if (!preview) return [];
    if (previewFilter === "ALL") return preview.rows;
    return preview.rows.filter((row) => row.status === previewFilter);
  }, [preview, previewFilter]);

  const previewTotalPages = Math.max(
    1,
    Math.ceil(filteredPreviewRows.length / PREVIEW_PAGE_SIZE),
  );

  const paginatedPreviewRows = useMemo(() => {
    const start = (previewPage - 1) * PREVIEW_PAGE_SIZE;
    return filteredPreviewRows.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [filteredPreviewRows, previewPage]);

  const changePreviewFilter = (filter: ProductImportPreviewFilter) => {
    setPreviewFilter(filter);
    setPreviewPage(1);
  };

  const changePreviewPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), previewTotalPages);
    setPreviewPage(nextPage);
  };

  return {
    step,
    selectedFile,
    preview,
    result,
    previewFilter,
    previewPage,
    previewTotalPages,
    paginatedPreviewRows,
    importMode,
    importValidRowsOnly,
    loadingTemplate,
    loadingPreview,
    loadingConfirm,
    error,
    setStep,
    setImportMode,
    setImportValidRowsOnly,
    downloadTemplate,
    selectFile,
    generatePreview,
    confirmImport,
    resetImport,
    changePreviewFilter,
    changePreviewPage,
  };
};
