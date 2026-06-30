import { Badge } from "@/components/ui/badge";
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
import {
  getStockDifference,
  getStockStatus,
} from "../../helpers/stockStatus.helper";

type Props = {
  data: StockResponse[];
  loading: boolean;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const TableStock = ({ data, loading }: Props) => {
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
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Depósito</TableHead>
            <TableHead className="text-right">Stock actual</TableHead>
            <TableHead className="text-right">Stock mínimo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Última actualización</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((stock) => {
            const stockStatus = getStockStatus(stock.quantity, stock.stock_min);

            const stockDifference = getStockDifference(
              stock.quantity,
              stock.stock_min,
            );

            return (
              <TableRow key={stock.idStock}>
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
                    <p className="text-xs text-muted-foreground">
                      ID Depósito: {stock.idDeposit}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="text-right font-semibold">
                  {formatNumber(stock.quantity)}
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                  {formatNumber(stock.stock_min)}
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
