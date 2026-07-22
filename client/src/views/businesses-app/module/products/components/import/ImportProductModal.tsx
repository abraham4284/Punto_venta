import { useEffect, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FileSpreadsheet,
  Settings2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useProductImport } from "../../hooks/useProductImport";
import type { ProductImportMode } from "../../types/product-import.types";
import { ProductImportPreviewTable } from "./ProductImportPreviewTable";
import { ProductImportResult } from "./ProductImportResult";

interface ImportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void | Promise<void>;
}

const importModeOptions: {
  value: ProductImportMode;
  title: string;
  description: string;
}[] = [
  {
    value: "CREATE_ONLY",
    title: "Solo crear nuevos",
    description: "Los codigos de barra ya existentes se omiten.",
  },
  {
    value: "UPDATE_EXISTING",
    title: "Crear y actualizar",
    description: "Si el codigo existe, actualiza producto y stock.",
  },
];

const formatExpiration = (value?: string) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
};

export const ImportProductModal = ({
  isOpen,
  onClose,
  onImported,
}: ImportProductModalProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
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
  } = useProductImport();

  useEffect(() => {
    if (!isOpen) {
      resetImport();
    }
  }, [isOpen, resetImport]);

  const handleClose = () => {
    resetImport();
    onClose();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    selectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    selectFile(file);
  };

  const handleConfirmImport = async () => {
    const imported = await confirmImport();

    if (imported) {
      await onImported();
    }
  };

  const canConfirm =
    Boolean(preview) &&
    !loadingConfirm &&
    preview!.summary.validRows + preview!.summary.warningRows > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Importar productos desde Excel</DialogTitle>
          <DialogDescription>
            Carga productos, precios, deposito inicial y stock en una unica
            operacion controlada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-4">
          {["UPLOAD", "PREVIEW", "CONFIRM", "RESULT"].map((item, index) => (
            <div
              key={item}
              className={`rounded-lg border p-3 text-sm ${
                step === item ? "border-primary bg-primary/5" : "bg-muted/30"
              }`}
            >
              <p className="font-medium">Paso {index + 1}</p>
              <p className="text-muted-foreground">
                {item === "UPLOAD" && "Archivo"}
                {item === "PREVIEW" && "Previsualizacion"}
                {item === "CONFIRM" && "Confirmacion"}
                {item === "RESULT" && "Resultado"}
              </p>
            </div>
          ))}
        </div>

        {step === "UPLOAD" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_260px]">
                <div
                  role="button"
                  tabIndex={0}
                  className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-6 text-center transition hover:bg-muted/50"
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") inputRef.current?.click();
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                >
                  <FileSpreadsheet className="mb-3 h-10 w-10 text-emerald-600" />
                  <h3 className="font-semibold">
                    Selecciona o arrastra tu archivo Excel
                  </h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Formatos permitidos: .xlsx y .xls. Limite maximo: 5MB y
                    5000 filas.
                  </p>
                  {selectedFile && (
                    <Badge variant="outline" className="mt-3">
                      {selectedFile.name}
                    </Badge>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="space-y-3 rounded-xl border bg-background p-4">
                  <h3 className="font-semibold">Plantilla recomendada</h3>
                  <p className="text-sm text-muted-foreground">
                    Descarga el Excel modelo para respetar columnas, formatos,
                    unidades y depositos.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loadingTemplate}
                    onClick={downloadTemplate}
                  >
                    {loadingTemplate ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Descargar plantilla
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "PREVIEW" && preview && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Revision previa</h3>
                <p className="text-sm text-muted-foreground">
                  El token de importacion vence a las{" "}
                  {formatExpiration(preview.expiresAt)}.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("CONFIRM")}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Configurar importacion
              </Button>
            </div>

            <ProductImportPreviewTable
              rows={paginatedPreviewRows}
              summary={preview.summary}
              filter={previewFilter}
              currentPage={previewPage}
              totalPages={previewTotalPages}
              onFilterChange={changePreviewFilter}
              onPageChange={changePreviewPage}
            />
          </div>
        )}

        {step === "CONFIRM" && preview && (
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-5 p-4">
                <div>
                  <h3 className="font-semibold">Configuracion final</h3>
                  <p className="text-sm text-muted-foreground">
                    Revisa como se deben tratar productos nuevos y codigos ya
                    existentes antes de tocar la base real.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {importModeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-lg border p-4 text-left transition ${
                        importMode === option.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setImportMode(option.value)}
                    >
                      <p className="font-medium">{option.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                <label className="flex items-start gap-3 rounded-lg border p-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={importValidRowsOnly}
                    onChange={(event) =>
                      setImportValidRowsOnly(event.target.checked)
                    }
                  />
                  <span>
                    <span className="block font-medium">
                      Importar solo filas validas
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Recomendado para evitar que una fila con advertencias
                      actualice productos sin revisar.
                    </span>
                  </span>
                </label>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                    <p className="text-xs">Validas</p>
                    <p className="text-xl font-bold">
                      {preview.summary.validRows}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-700">
                    <p className="text-xs">Advertencias</p>
                    <p className="text-xl font-bold">
                      {preview.summary.warningRows}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-red-700">
                    <p className="text-xs">Invalidas</p>
                    <p className="text-xl font-bold">
                      {preview.summary.invalidRows}
                    </p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-3 text-violet-700">
                    <p className="text-xs">Duplicadas</p>
                    <p className="text-xl font-bold">
                      {preview.summary.duplicateRows}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "RESULT" && result && <ProductImportResult result={result} />}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cerrar
          </Button>

          {step === "UPLOAD" && (
            <Button
              type="button"
              disabled={!selectedFile || loadingPreview}
              onClick={generatePreview}
            >
              {loadingPreview ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Previsualizar
            </Button>
          )}

          {step === "PREVIEW" && (
            <Button type="button" onClick={() => setStep("CONFIRM")}>
              Continuar
            </Button>
          )}

          {step === "CONFIRM" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("PREVIEW")}
              >
                Volver
              </Button>
              <Button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirmImport}
              >
                {loadingConfirm ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Confirmar importacion
              </Button>
            </>
          )}

          {step === "RESULT" && (
            <Button type="button" onClick={handleClose}>
              Finalizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
