import { Badge } from "@/components/ui/badge";
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
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const getBadgeClassName = (status: CriticalStockAlertStatus) => {
  const styles: Record<CriticalStockAlertStatus, string> = {
    CRITICAL_ZERO: "bg-red-50 text-red-700 ring-1 ring-red-100",
    CRITICAL_LOW: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
    CRITICAL_EQUAL: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    STOCK_OK: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  };

  return styles[status];
};

export const CriticalStockTable = ({
  data,
  loading,
}: CriticalStockTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Deposito</TableHead>
          <TableHead>Stock minimo</TableHead>
          <TableHead>Stock actual</TableHead>
          <TableHead>Estado alerta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5} className="h-28 text-center">
              <div className="flex items-center justify-center">
                <Spinner />
              </div>
            </TableCell>
          </TableRow>
        ) : null}

        {!loading && data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-28 text-center">
              No hay productos dentro del criterio seleccionado.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? data.map((item) => (
              <TableRow key={`${item.idStock}-${item.idDeposit}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Sin img
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.barcode || "Sin codigo"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.depositName}</TableCell>
                <TableCell>{formatNumber(item.stockMin)}</TableCell>
                <TableCell className="font-semibold">
                  {formatNumber(item.quantity)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getBadgeClassName(item.alertStatus)}
                  >
                    {item.alertMessage}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </Table>
  );
};
