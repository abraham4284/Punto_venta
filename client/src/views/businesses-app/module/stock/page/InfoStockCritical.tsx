import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import {
  Download,
  FileSpreadsheet,
  PackagePlus,
  Printer,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "../../auth/store/auth.store";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import { AddToPurchaseModal } from "../../purchases/components/modal/AddToPurchaseModal";
import { PurchaseCartSheet } from "../../purchases/components/sheet/PurchaseCartSheet";
import { usePurchaseCartStore } from "../../purchases/store/purchaseCart.store";
import type { PurchaseCartItem } from "../../purchases/types";
import type { ProductResponse } from "../../products/types/products.types";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { CriticalMetrics, CriticalStockTable } from "../components";
import { useStock } from "../hooks/useStock";
import type {
  CriticalStockAlertStatus,
  CriticalStockReportResponse,
} from "../types/stock.types";

const statusOptions: {
  label: string;
  value: CriticalStockAlertStatus | null;
}[] = [
  { label: "Todos", value: null },
  { label: "Sin stock", value: "CRITICAL_ZERO" },
  { label: "Bajo minimo", value: "CRITICAL_LOW" },
  { label: "En el minimo", value: "CRITICAL_EQUAL" },
];

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const escapeHtml = (value: string | number | null | undefined) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const getRowKey = (item: CriticalStockReportResponse) => {
  return `${item.idProduct}-${item.idDeposit}`;
};

const getShortageQuantity = (item: CriticalStockReportResponse) => {
  return Math.max(item.stockMin - item.quantity, 0);
};

const getInitialPurchaseQuantity = (item: CriticalStockReportResponse) => {
  const shortage = getShortageQuantity(item);
  return shortage > 0 ? shortage : 1;
};

const getStatusLabel = (status: CriticalStockAlertStatus) => {
  const labels: Record<CriticalStockAlertStatus, string> = {
    CRITICAL_ZERO: "Sin stock",
    CRITICAL_LOW: "Bajo minimo",
    CRITICAL_EQUAL: "En el minimo",
  };

  return labels[status];
};

const roundMoney = (value: Decimal) => {
  return Number(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
};

const mapCriticalItemToProduct = (
  item: CriticalStockReportResponse,
): ProductResponse => {
  return {
    idProduct: item.idProduct,
    idDeposit: item.idDeposit,
    idBusiness: item.idBusiness,
    idProductCategory: 0,
    categoryName: null,
    productCategoryName: null,
    barcode: item.barcode,
    name: item.productName,
    description: null,
    imageUrl: item.imageUrl,
    priceCost: item.priceCost,
    priceSale: item.priceCost,
    priceWholesale: null,
    unitType: item.unitType,
    stock: item.quantity,
    stockMin: item.stockMin,
    isActive: true,
    createdAt: new Date(),
    updatedAt: null,
  };
};

const mapCriticalItemToCartItem = (
  item: CriticalStockReportResponse,
): PurchaseCartItem => {
  const quantity = getInitialPurchaseQuantity(item);
  const subtotal = roundMoney(new Decimal(quantity).mul(item.priceCost));

  return {
    idProduct: item.idProduct,
    productName: item.productName,
    barcode: item.barcode,
    imageUrl: item.imageUrl,
    idDeposit: item.idDeposit,
    depositName: item.depositName,
    quantity,
    unitPrice: item.priceCost,
    discountAmount: 0,
    subtotal,
  };
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

const buildExcelRows = (data: CriticalStockReportResponse[]) => {
  return data
    .map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.productName)}</td>
          <td>${escapeHtml(item.barcode || "Sin codigo")}</td>
          <td>${escapeHtml(item.depositName)}</td>
          <td>${formatNumber(item.quantity)}</td>
          <td>${formatNumber(item.stockMin)}</td>
          <td>${formatNumber(getShortageQuantity(item))}</td>
          <td>${escapeHtml(getStatusLabel(item.alertStatus))}</td>
        </tr>
      `;
    })
    .join("");
};

const exportToExcel = (
  data: CriticalStockReportResponse[],
  fileSuffix: string,
) => {
  const rows = buildExcelRows(data);
  const content = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Codigo de barras</th>
              <th>Deposito</th>
              <th>Stock actual</th>
              <th>Stock minimo</th>
              <th>Faltante minimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

  downloadBlob(
    content,
    `reposicion-inventario-${fileSuffix}.xls`,
    "application/vnd.ms-excel;charset=utf-8",
  );
};

const buildPdfRows = (data: CriticalStockReportResponse[]) => {
  return data
    .map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.productName)}</td>
          <td>${escapeHtml(item.barcode || "-")}</td>
          <td>${escapeHtml(item.depositName)}</td>
          <td>${formatNumber(item.quantity)}</td>
          <td>${formatNumber(item.stockMin)}</td>
          <td>${formatNumber(getShortageQuantity(item))}</td>
          <td class="write-line"></td>
        </tr>
      `;
    })
    .join("");
};

const exportToPdf = (params: {
  data: CriticalStockReportResponse[];
  businessName: string;
  depositName: string;
}) => {
  const reportWindow = window.open("", "_blank", "width=1024,height=768");

  if (!reportWindow) {
    toast.error("El navegador bloqueo la ventana de impresion.");
    return;
  }

  reportWindow.document.write(`
    <html>
      <head>
        <title>Lista de reposicion</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          .meta { color: #4b5563; margin: 0 0 18px; font-size: 12px; line-height: 1.5; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th, td { border: 1px solid #d1d5db; padding: 7px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
          .write-line { min-width: 100px; height: 28px; }
          .observations { margin-top: 22px; font-size: 12px; }
          .line { border-bottom: 1px solid #111827; height: 24px; }
          @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>Lista de reposicion</h1>
        <p class="meta">
          Negocio: ${escapeHtml(params.businessName)}<br />
          Deposito: ${escapeHtml(params.depositName)}<br />
          Fecha de generacion: ${new Date().toLocaleString("es-AR")}<br />
          Cantidad de registros: ${params.data.length}
        </p>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Codigo</th>
              <th>Deposito</th>
              <th>Actual</th>
              <th>Minimo</th>
              <th>Faltante</th>
              <th>Cantidad a comprar</th>
            </tr>
          </thead>
          <tbody>${buildPdfRows(params.data)}</tbody>
        </table>
        <div class="observations">
          <strong>Observaciones:</strong>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};

export const InfoStockCritical = () => {
  const navigate = useNavigate();
  const canCreatePurchase = useCan("purchases.create");
  const businessName = useAuthStore((state) => {
    return state.user?.businessName ?? "Cajora";
  });
  const cart = usePurchaseCartStore((state) => state.cart);
  const addPurchaseItem = usePurchaseCartStore((state) => state.addItem);
  const removePurchaseItem = usePurchaseCartStore((state) => state.removeItem);
  const {
    criticalStockData,
    criticalMetrics,
    loadingReport,
    maxQuantityFilter,
    depositFilter,
    criticalStatusFilter,
    productSearch,
    setMaxQuantityFilter,
    setDepositFilter,
    setCriticalStatusFilter,
    setProductSearch,
    getCriticalStockReport,
    resetStock,
  } = useStock();

  const { deposits, getDeposits, resetDeposits } = useDeposits();
  const [depositSearch, setDepositSearch] = useState("");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [purchaseProduct, setPurchaseProduct] =
    useState<ProductResponse | null>(null);
  const [purchaseDepositId, setPurchaseDepositId] = useState<number | null>(
    null,
  );
  const [purchaseQuantity, setPurchaseQuantity] = useState<number | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPurchaseCartSheetOpen, setIsPurchaseCartSheetOpen] = useState(false);

  const filteredDeposits = useMemo(() => {
    const value = depositSearch.trim().toLowerCase();

    if (!value) return deposits;

    return deposits.filter((deposit) => {
      return deposit.name.toLowerCase().includes(value);
    });
  }, [depositSearch, deposits]);

  const selectedRows = useMemo(() => {
    const selectedSet = new Set(selectedKeys);
    return criticalStockData.filter((item) => {
      return selectedSet.has(getRowKey(item));
    });
  }, [criticalStockData, selectedKeys]);

  const selectedDepositName = useMemo(() => {
    if (!depositFilter) return "Todos los depositos";

    return (
      (deposits.find((deposit) => deposit.idDeposit === depositFilter)?.name ??
      depositSearch) ||
      "Deposito seleccionado"
    );
  }, [depositFilter, depositSearch, deposits]);

  useEffect(() => {
    void getDeposits();

    return () => {
      resetDeposits();
      resetStock();
    };
  }, [getDeposits, resetDeposits, resetStock]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getCriticalStockReport();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [getCriticalStockReport]);

  const handleSelectDeposit = (deposit: DepositResponse) => {
    setSelectedKeys([]);
    setDepositFilter(deposit.idDeposit);
    setDepositSearch(deposit.name);
    setIsDepositOpen(false);
  };

  const handleClearDeposit = () => {
    setSelectedKeys([]);
    setDepositFilter(null);
    setDepositSearch("");
    setIsDepositOpen(false);
  };

  const handleToggleRow = (item: CriticalStockReportResponse) => {
    const rowKey = getRowKey(item);

    setSelectedKeys((current) => {
      if (current.includes(rowKey)) {
        return current.filter((key) => key !== rowKey);
      }

      return [...current, rowKey];
    });
  };

  const handleToggleAll = () => {
    const visibleKeys = criticalStockData.map(getRowKey);
    const allVisibleSelected =
      visibleKeys.length > 0 &&
      visibleKeys.every((key) => selectedKeys.includes(key));

    if (allVisibleSelected) {
      setSelectedKeys([]);
      return;
    }

    setSelectedKeys(visibleKeys);
  };

  const handleOpenPurchaseModal = (item: CriticalStockReportResponse) => {
    setPurchaseProduct(mapCriticalItemToProduct(item));
    setPurchaseDepositId(item.idDeposit);
    setPurchaseQuantity(getInitialPurchaseQuantity(item));
    setIsPurchaseModalOpen(true);
  };

  const handleAddPurchaseItem = (item: PurchaseCartItem) => {
    addPurchaseItem(item);
    toast.success("Producto agregado al carrito de compra");
  };

  const handleAddSelectedToPurchase = () => {
    if (selectedRows.length === 0) return;

    const withoutCost = selectedRows.filter((item) => item.priceCost <= 0);

    if (withoutCost.length > 0) {
      toast.error("Hay productos seleccionados sin costo cargado.");
      return;
    }

    selectedRows.forEach((item) => {
      addPurchaseItem(mapCriticalItemToCartItem(item));
    });
    toast.success(`${selectedRows.length} productos agregados al carrito`);
    setSelectedKeys([]);
  };

  const handleContinuePurchase = () => {
    setIsPurchaseCartSheetOpen(false);
    navigate("/admin/purchases");
  };

  const handleExportExcel = (data: CriticalStockReportResponse[], suffix: string) => {
    if (data.length === 0) return;
    exportToExcel(data, suffix);
    setIsExportOpen(false);
  };

  const handleExportPdf = (data: CriticalStockReportResponse[]) => {
    if (data.length === 0) return;
    exportToPdf({
      data,
      businessName,
      depositName: selectedDepositName,
    });
    setIsExportOpen(false);
  };

  return (
    <>
      <Meta title="Reposicion de inventario" />
      <main className="space-y-6 p-3 md:p-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Reposicion de inventario
            </h1>
            <p className="text-muted-foreground">
              Identifica productos agotados o con bajo stock y prepara la
              proxima reposicion.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsExportOpen((value) => !value)}
                disabled={criticalStockData.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>

              {isExportOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border bg-background p-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleExportExcel(criticalStockData, "todos")}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel - todos los resultados
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleExportPdf(criticalStockData)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    PDF - todos los resultados
                  </button>
                  {selectedRows.length > 0 ? (
                    <>
                      <div className="my-1 border-t" />
                      <button
                        type="button"
                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleExportExcel(selectedRows, "seleccion")}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Excel - seleccion
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleExportPdf(selectedRows)}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        PDF - seleccion
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            {canCreatePurchase ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPurchaseCartSheetOpen(true)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Carrito ({cart.length})
              </Button>
            ) : null}
          </div>
        </section>

        <CriticalMetrics metrics={criticalMetrics} />

        <Card>
          <CardContent className="space-y-4">
            <section className="grid gap-4">
              <div className="grid gap-2">
                <Label>Estado</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => {
                    const isActive = criticalStatusFilter === option.value;

                    return (
                      <Button
                        key={option.label}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedKeys([]);
                          setCriticalStatusFilter(option.value);
                        }}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
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
                        setSelectedKeys([]);

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
                      <button
                        type="button"
                        className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={handleClearDeposit}
                      >
                        Todos los depositos
                      </button>
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
                      onChange={(event) => {
                        setSelectedKeys([]);
                        setProductSearch(event.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full lg:w-auto"
                    onClick={() => setShowAdvancedFilters((value) => !value)}
                  >
                    Mas filtros
                  </Button>
                </div>
              </div>

              {showAdvancedFilters ? (
                <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:max-w-xs">
                  <Label htmlFor="maxQuantity">Cantidad maxima</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    min={0}
                    value={maxQuantityFilter ?? ""}
                    placeholder="Sin limite adicional"
                    onChange={(event) => {
                      setSelectedKeys([]);
                      setMaxQuantityFilter(
                        event.target.value ? Number(event.target.value) : null,
                      );
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Filtro adicional heredado. La reposicion se basa en stock
                    actual menor o igual al minimo.
                  </p>
                </div>
              ) : null}
            </section>

            {selectedRows.length > 0 ? (
              <section className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/40 p-3 md:flex-row md:items-center">
                <p className="text-sm font-medium">
                  {selectedRows.length} registro
                  {selectedRows.length === 1 ? "" : "s"} seleccionado
                  {selectedRows.length === 1 ? "" : "s"}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExportExcel(selectedRows, "seleccion")}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar seleccion
                  </Button>
                  {canCreatePurchase ? (
                    <Button type="button" onClick={handleAddSelectedToPurchase}>
                      <PackagePlus className="mr-2 h-4 w-4" />
                      Agregar a compra
                    </Button>
                  ) : null}
                </div>
              </section>
            ) : null}

            <CriticalStockTable
              data={criticalStockData}
              loading={loadingReport}
              canCreatePurchase={canCreatePurchase}
              selectedKeys={selectedKeys}
              onToggleRow={handleToggleRow}
              onToggleAll={handleToggleAll}
              onAddToPurchase={handleOpenPurchaseModal}
            />
          </CardContent>
        </Card>

        <AddToPurchaseModal
          isOpen={isPurchaseModalOpen}
          product={purchaseProduct}
          deposits={deposits}
          defaultDepositId={purchaseDepositId}
          defaultQuantity={purchaseQuantity}
          onClose={() => setIsPurchaseModalOpen(false)}
          onConfirm={handleAddPurchaseItem}
        />

        <PurchaseCartSheet
          isOpen={isPurchaseCartSheetOpen}
          cart={cart}
          canContinue={canCreatePurchase}
          onClose={() => setIsPurchaseCartSheetOpen(false)}
          onContinue={handleContinuePurchase}
          onRemove={removePurchaseItem}
        />
      </main>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
};
