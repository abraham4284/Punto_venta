import { Package, PackagePlus } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import type {
  CriticalStockAlertStatus,
  CriticalStockReportResponse,
} from "../../types/stock.types";

interface CriticalStockTableProps {
  data: CriticalStockReportResponse[];
  loading: boolean;
  canCreatePurchase: boolean;
  selectedKeys: string[];
  onToggleRow: (item: CriticalStockReportResponse) => void;
  onToggleAll: () => void;
  onAddToPurchase: (item: CriticalStockReportResponse) => void;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const getRowKey = (item: CriticalStockReportResponse) => {
  return `${item.idProduct}-${item.idDeposit}`;
};

const getShortageQuantity = (item: CriticalStockReportResponse) => {
  return Math.max(item.stockMin - item.quantity, 0);
};

const getBadgeClassName = (status: CriticalStockAlertStatus) => {
  const styles: Record<CriticalStockAlertStatus, string> = {
    CRITICAL_ZERO: "bg-red-50 text-red-700 ring-1 ring-red-100",
    CRITICAL_LOW: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
    CRITICAL_EQUAL: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  };

  return styles[status];
};

const getStatusLabel = (status: CriticalStockAlertStatus) => {
  const labels: Record<CriticalStockAlertStatus, string> = {
    CRITICAL_ZERO: "Sin stock",
    CRITICAL_LOW: "Bajo minimo",
    CRITICAL_EQUAL: "En el minimo",
  };

  return labels[status];
};

export const CriticalStockTable = ({
  data,
  loading,
  canCreatePurchase,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  onAddToPurchase,
}: CriticalStockTableProps) => {
  const visibleKeys = data.map(getRowKey);
  const selectedVisibleCount = visibleKeys.filter((key) =>
    selectedKeys.includes(key),
  ).length;
  const allVisibleSelected =
    visibleKeys.length > 0 && selectedVisibleCount === visibleKeys.length;
  const isIndeterminate =
    selectedVisibleCount > 0 && selectedVisibleCount < visibleKeys.length;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Seleccionar todos los resultados visibles"
                checked={allVisibleSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-muted-foreground/30"
              />
            </TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Deposito</TableHead>
            <TableHead>Stock actual</TableHead>
            <TableHead>Stock minimo</TableHead>
            <TableHead>
              <span className="block">Faltante minimo</span>
              <span className="text-xs font-normal text-muted-foreground">
                Para alcanzar el minimo configurado.
              </span>
            </TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Accion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-28 text-center">
                <div className="flex items-center justify-center">
                  <Spinner />
                </div>
              </TableCell>
            </TableRow>
          ) : null}

          {!loading && data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-28 text-center">
                No hay productos que requieran reposicion con los filtros
                seleccionados.
              </TableCell>
            </TableRow>
          ) : null}

          {!loading
            ? data.map((item) => {
                const rowKey = getRowKey(item);
                const isSelected = selectedKeys.includes(rowKey);

                return (
                  <TableRow key={rowKey}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${item.productName} en ${item.depositName}`}
                        checked={isSelected}
                        onChange={() => onToggleRow(item)}
                        className="h-4 w-4 rounded border-muted-foreground/30"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-48">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.barcode || "Sin codigo"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.depositName}</TableCell>
                    <TableCell className="font-semibold">
                      {formatNumber(item.quantity)}
                    </TableCell>
                    <TableCell>{formatNumber(item.stockMin)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatNumber(getShortageQuantity(item))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getBadgeClassName(item.alertStatus)}
                      >
                        {getStatusLabel(item.alertStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canCreatePurchase ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onAddToPurchase(item)}
                        >
                          <PackagePlus className="mr-2 h-4 w-4" />
                          Agregar
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Solo lectura
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            : null}
        </TableBody>
      </Table>
    </div>
  );
};
