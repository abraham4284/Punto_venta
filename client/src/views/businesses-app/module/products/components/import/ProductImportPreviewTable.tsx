import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ProductImportPreviewFilter,
  ProductImportPreviewRow,
  ProductImportPreviewSummary,
} from "../../types/product-import.types";

interface ProductImportPreviewTableProps {
  rows: ProductImportPreviewRow[];
  summary: ProductImportPreviewSummary;
  filter: ProductImportPreviewFilter;
  currentPage: number;
  totalPages: number;
  onFilterChange: (filter: ProductImportPreviewFilter) => void;
  onPageChange: (page: number) => void;
}

const FILTERS: {
  value: ProductImportPreviewFilter;
  label: string;
  getCount: (summary: ProductImportPreviewSummary) => number;
}[] = [
  { value: "ALL", label: "Todas", getCount: (summary) => summary.totalRows },
  {
    value: "VALID",
    label: "Validas",
    getCount: (summary) => summary.validRows,
  },
  {
    value: "WARNING",
    label: "Con advertencias",
    getCount: (summary) => summary.warningRows,
  },
  {
    value: "INVALID",
    label: "Invalidas",
    getCount: (summary) => summary.invalidRows,
  },
  {
    value: "DUPLICATE",
    label: "Duplicadas",
    getCount: (summary) => summary.duplicateRows,
  },
];

const getStatusLabel = (status: ProductImportPreviewRow["status"]) => {
  const labels = {
    VALID: "Valida",
    WARNING: "Advertencia",
    INVALID: "Invalida",
    DUPLICATE: "Duplicada",
  };

  return labels[status];
};

const getStatusClassName = (status: ProductImportPreviewRow["status"]) => {
  const classNames = {
    VALID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    WARNING: "bg-amber-50 text-amber-700 border-amber-200",
    INVALID: "bg-red-50 text-red-700 border-red-200",
    DUPLICATE: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return classNames[status];
};

const getActionLabel = (action: ProductImportPreviewRow["action"]) => {
  const labels = {
    CREATE_PRODUCT: "Nuevo producto",
    CREATE_STOCK: "Nuevo deposito",
    UPDATE_PRODUCT: "Actualizar producto",
    ADD_STOCK: "Stock existente",
    SKIP: "Omitir",
  };

  return labels[action];
};

const getActionClassName = (action: ProductImportPreviewRow["action"]) => {
  const classNames = {
    CREATE_PRODUCT: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CREATE_STOCK: "bg-blue-50 text-blue-700 border-blue-200",
    UPDATE_PRODUCT: "bg-amber-50 text-amber-700 border-amber-200",
    ADD_STOCK: "bg-violet-50 text-violet-700 border-violet-200",
    SKIP: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return classNames[action];
};

export const ProductImportPreviewTable = ({
  rows,
  summary,
  filter,
  currentPage,
  totalPages,
  onFilterChange,
  onPageChange,
}: ProductImportPreviewTableProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            onClick={() => onFilterChange(item.value)}
          >
            {item.label} ({item.getCount(summary)})
          </Button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fila</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Deposito</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={`${row.rowNumber}-${row.barcode ?? row.name}`}>
                  <TableCell>{row.rowNumber}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusClassName(row.status)}
                    >
                      {getStatusLabel(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-60 whitespace-normal">
                      <p className="font-medium">{row.name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.barcode || "Sin codigo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accion:
                      </p>
                      <Badge
                        variant="outline"
                        className={getActionClassName(row.action)}
                      >
                        {getActionLabel(row.action)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{row.categoryName}</TableCell>
                  <TableCell>{row.depositName}</TableCell>
                  <TableCell>
                    <div>
                      <p>${row.priceSale.toLocaleString("es-AR")}</p>
                      <p className="text-xs text-muted-foreground">
                        Costo ${row.priceCost.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.initialStock.toLocaleString("es-AR")} {row.unitType}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-36 text-sm">
                      {row.existingStockQuantity !== null ? (
                        <>
                          <p>
                            Actual:{" "}
                            {row.existingStockQuantity.toLocaleString("es-AR")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Si suma:{" "}
                            {row.resultingStockQuantity?.toLocaleString(
                              "es-AR",
                            ) ?? "-"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p>Nuevo stock</p>
                          <p className="text-xs text-muted-foreground">
                            Inicial:{" "}
                            {row.initialStock.toLocaleString("es-AR")}
                          </p>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-80 space-y-1 whitespace-normal">
                      {row.errors.map((message) => (
                        <p
                          key={`${row.rowNumber}-error-${message}`}
                          className="flex gap-1 text-xs text-red-600"
                        >
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                          {message}
                        </p>
                      ))}
                      {row.warnings.map((message) => (
                        <p
                          key={`${row.rowNumber}-warning-${message}`}
                          className="flex gap-1 text-xs text-amber-600"
                        >
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                          {message}
                        </p>
                      ))}
                      {row.errors.length === 0 && row.warnings.length === 0 && (
                        <p className="flex gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                          Lista para importar
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No hay filas para mostrar con este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Pagina {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
