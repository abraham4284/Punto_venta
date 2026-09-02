import { Settings2, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockResponse } from "../../types/stock.types";
import type { AdvancedStockPagination } from "../../types/stock.types";
import {
  getStockDifference,
  getStockStatus,
} from "../../helpers/stockStatus.helper";
import { PRODUCT_UNIT_TYPE_OPTIONS } from "../../../products/types/products.types";

type Props = {
  data: StockResponse[];
  loading: boolean;
  pagination: AdvancedStockPagination;
  onQuickAdjust: (stock: StockResponse) => void;
  onAddToPurchase?: (stock: StockResponse) => void;
  onPageChange: (page: number) => void;
  canCreatePurchase?: boolean;
  canAdjustStock?: boolean;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const getUnitOption = (unitType: StockResponse["unitType"]) => {
  return PRODUCT_UNIT_TYPE_OPTIONS.find((option) => {
    return option.value === unitType;
  });
};

const getProductStatusBadgeClassName = (isActive: boolean): string => {
  if (isActive) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
};

const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

export const TableStock = ({
  data,
  loading,
  pagination,
  onQuickAdjust,
  onAddToPurchase,
  onPageChange,
  canCreatePurchase = false,
  canAdjustStock = false,
}: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No hay stock registrado.
      </div>
    );
  }
  const pages = getVisiblePages(pagination.currentPage, pagination.totalPages);
  const firstRecord =
    pagination.totalRecords === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.limit + 1;
  const lastRecord = Math.min(
    pagination.currentPage * pagination.limit,
    pagination.totalRecords,
  );

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Depósito</TableHead>
            <TableHead className="text-right">Stock actual</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Activo/Inactivo</TableHead>
            <TableHead className="text-right">Stock mínimo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Última actualización</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((stock) => {
            const stockStatus = getStockStatus(stock.quantity, stock.stock_min);
            const unitOption = getUnitOption(stock.unitType ?? "UNIT");

            const stockDifference = getStockDifference(
              stock.quantity,
              stock.stock_min,
            );

            return (
              <TableRow
                key={stock.idStock}
                className={!stock.isActive ? "bg-muted/35" : undefined}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    {stock.productImageUrl ? (
                      <img
                        src={stock.productImageUrl}
                        alt={stock.productName}
                        className="h-11 w-11 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                        Sin img
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {stock.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stock.categoryName}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <p className="font-medium">{stock.depositName}</p>
                  </div>
                </TableCell>

                <TableCell className="text-right font-semibold">
                  {formatNumber(stock.quantity)}{" "}
                  {unitOption?.shortLabel ?? "u."}
                </TableCell>

                <TableCell>
                  <Badge variant="outline">
                    {unitOption?.label ?? "Unidad"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={getProductStatusBadgeClassName(stock.isActive)}
                  >
                    {stock.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                  {formatNumber(stock.stock_min)}{" "}
                  {unitOption?.shortLabel ?? "u."}
                </TableCell>

                <TableCell>
                  <Badge variant={stockStatus.variant}>
                    {stockStatus.label}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {stockDifference}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {stock.updatedAt
                      ? new Date(stock.updatedAt).toLocaleDateString("es-AR")
                      : "-"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canCreatePurchase && onAddToPurchase && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onAddToPurchase(stock)}
                        title="Agregar a compra"
                        aria-label={`Agregar ${stock.productName} a compra`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    )}
                    {canAdjustStock && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onQuickAdjust(stock)}
                        title="Ajuste rapido"
                        aria-label={`Ajuste rapido para ${stock.productName}`}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex flex-col items-center justify-between gap-3 border-t p-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          Mostrando {firstRecord}-{lastRecord} de {pagination.totalRecords}{" "}
          registros
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pagination.currentPage <= 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
          >
            Anterior
          </Button>

          {pages.map((page) => (
            <Button
              key={page}
              type="button"
              size="icon"
              variant={page === pagination.currentPage ? "default" : "outline"}
              aria-label={`Ir a la pagina ${page}`}
              aria-current={
                page === pagination.currentPage ? "page" : undefined
              }
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            type="button"
            variant="outline"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => onPageChange(pagination.currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};
