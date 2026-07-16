import { useEffect, useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import { CriticalMetrics, CriticalStockTable } from "../components";
import { useStock } from "../hooks/useStock";
import type { CriticalStockReportResponse } from "../types/stock.types";

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const downloadBlob = (content: string, fileName: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};

const buildReportRows = (data: CriticalStockReportResponse[]) => {
  return data
    .map((item) => {
      return `
        <tr>
          <td>${item.productName}</td>
          <td>${item.barcode || "Sin codigo"}</td>
          <td>${item.depositName}</td>
          <td>${formatNumber(item.stockMin)}</td>
          <td>${formatNumber(item.quantity)}</td>
          <td>${item.alertMessage}</td>
        </tr>
      `;
    })
    .join("");
};

const exportToExcel = (data: CriticalStockReportResponse[]) => {
  const rows = buildReportRows(data);
  const content = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Codigo</th>
              <th>Deposito</th>
              <th>Stock minimo</th>
              <th>Stock actual</th>
              <th>Estado alerta</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

  downloadBlob(
    content,
    "informe-stock-critico.xls",
    "application/vnd.ms-excel;charset=utf-8",
  );
};

const exportToPdf = (data: CriticalStockReportResponse[]) => {
  const rows = buildReportRows(data);
  const reportWindow = window.open("", "_blank", "width=1024,height=768");

  if (!reportWindow) return;

  reportWindow.document.write(`
    <html>
      <head>
        <title>Informe de stock critico</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          p { color: #4b5563; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Informe de stock critico</h1>
        <p>Productos con stock dentro del umbral seleccionado.</p>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Codigo</th>
              <th>Deposito</th>
              <th>Stock minimo</th>
              <th>Stock actual</th>
              <th>Estado alerta</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};

export const InfoStockCritical = () => {
  const {
    criticalStockData,
    criticalMetrics,
    loadingReport,
    maxQuantityFilter,
    depositFilter,
    productSearch,
    setMaxQuantityFilter,
    setDepositFilter,
    setProductSearch,
    getCriticalStockReport,
    resetStock,
  } = useStock();

  const { deposits, getDeposits, resetDeposits } = useDeposits();
  const [depositSearch, setDepositSearch] = useState("");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const filteredDeposits = useMemo(() => {
    const value = depositSearch.trim().toLowerCase();

    if (!value) return deposits;

    return deposits.filter((deposit) => {
      return deposit.name.toLowerCase().includes(value);
    });
  }, [depositSearch, deposits]);

  useEffect(() => {
    getDeposits();

    return () => {
      resetDeposits();
      resetStock();
    };
  }, [getDeposits, resetDeposits, resetStock]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      getCriticalStockReport();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [getCriticalStockReport]);

  const handleSelectDeposit = (deposit: DepositResponse) => {
    setDepositFilter(deposit.idDeposit);
    setDepositSearch(deposit.name);
    setIsDepositOpen(false);
  };

  const handleClearDeposit = () => {
    setDepositFilter(null);
    setDepositSearch("");
    setIsDepositOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel(criticalStockData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    exportToPdf(criticalStockData);
    setIsExportOpen(false);
  };

  return (
    <>
      <Meta title="Stock Critico" />
      <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Informe de stock critico
          </h1>
          <p className="text-muted-foreground">
            Auditoria de productos con stock bajo, igual al minimo o agotado.
          </p>
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExportOpen((value) => !value)}
            disabled={criticalStockData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>

          {isExportOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border bg-background p-1 shadow-lg">
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={handleExportExcel}
              >
                Exportar Excel
              </button>
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={handleExportPdf}
              >
                Exportar PDF
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <CriticalMetrics metrics={criticalMetrics} />

      <Card>
        <CardContent className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="maxQuantity">Cantidad maxima</Label>
              <Input
                id="maxQuantity"
                type="number"
                min={0}
                value={maxQuantityFilter}
                onChange={(event) =>
                  setMaxQuantityFilter(Number(event.target.value) || 0)
                }
              />
            </div>

            <div className="relative grid gap-2">
              <Label htmlFor="depositSearch">Deposito</Label>
              <div className="relative">
                <Input
                  id="depositSearch"
                  value={depositSearch}
                  placeholder="Buscar deposito..."
                  onFocus={() => setIsDepositOpen(true)}
                  onChange={(event) => {
                    setDepositSearch(event.target.value);
                    setIsDepositOpen(true);

                    if (!event.target.value) {
                      setDepositFilter(null);
                    }
                  }}
                />
                {depositFilter ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                    onClick={handleClearDeposit}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {isDepositOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border bg-background p-1 shadow-lg">
                  {filteredDeposits.length > 0 ? (
                    filteredDeposits.map((deposit) => (
                      <button
                        key={deposit.idDeposit}
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleSelectDeposit(deposit)}
                      >
                        <span>{deposit.name}</span>
                        {deposit.isDefault ? (
                          <span className="text-xs text-muted-foreground">
                            Predeterminado
                          </span>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Sin resultados
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="productSearch">Producto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="productSearch"
                  value={productSearch}
                  placeholder="Buscar por nombre o codigo..."
                  className="pl-9"
                  onChange={(event) => setProductSearch(event.target.value)}
                />
              </div>
            </div>
          </section>

          <CriticalStockTable
            data={criticalStockData}
            loading={loadingReport}
          />
        </CardContent>
      </Card>
      </main>
    </>
  );
};
