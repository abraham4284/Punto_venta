import { Eye } from "lucide-react";
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
import { getPurchaseStatusLabel } from "../../data/purchaseStatus.data";
import type {
  PurchaseResponse,
  PurchasesPagination,
} from "../../types";
import { CancelPurchaseDialog } from "../modal/CancelPurchaseDialog";

type Props = {
  purchases: PurchaseResponse[];
  pagination: PurchasesPagination;
  loading: boolean;
  cancelingId: number | null;
  onView: (idPurchase: number) => void;
  onCancel: (idPurchase: number) => void;
  onPageChange: (page: number) => void;
};

const formatDate = (value: Date | string): string => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const getStatusVariant = (
  status: PurchaseResponse["status"],
): "default" | "destructive" => {
  return status === "COMPLETED" ? "default" : "destructive";
};

const getPages = (currentPage: number, totalPages: number): number[] => {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

export const PurchaseTable = ({
  purchases,
  pagination,
  loading,
  cancelingId,
  onView,
  onCancel,
  onPageChange,
}: Props) => {
  const pages = getPages(pagination.currentPage, pagination.totalPages);

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead>Compra</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Deposito</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No hay compras para mostrar
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.idPurchase}>
                  <TableCell className="font-medium">
                    {purchase.purchaseNumber}
                  </TableCell>
                  <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                  <TableCell>
                    {purchase.supplierName || "Sin proveedor"}
                  </TableCell>
                  <TableCell>{purchase.depositName}</TableCell>
                  <TableCell>{purchase.userName}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(purchase.status)}>
                      {getPurchaseStatusLabel(purchase.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(purchase.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        title="Ver detalle"
                        onClick={() => onView(purchase.idPurchase)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {purchase.status !== "CANCELLED" && (
                        <CancelPurchaseDialog
                          loading={cancelingId === purchase.idPurchase}
                          disabled={cancelingId !== null}
                          onConfirm={() => onCancel(purchase.idPurchase)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
        <p className="text-sm text-muted-foreground">
          {pagination.totalRecords} registros - pagina{" "}
          {pagination.currentPage} de {pagination.totalPages}
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
              variant={page === pagination.currentPage ? "default" : "outline"}
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
