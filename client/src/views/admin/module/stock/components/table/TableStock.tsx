// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
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

type Props = {
  data: StockResponse[];
  loading: boolean;
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
        No hay depósitos registrados.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deposito</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Cantidad</TableHead>
          {/* <TableHead className="text-right">Acciones</TableHead> */}
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((stock) => (
          <TableRow key={stock.idStock}>
            <TableCell className="font-medium">{stock.depositName}</TableCell>
            <TableCell>
              {stock.productImageUrl ? (
                <div className="flex gap-2 items-center">
                  <img
                    src={stock.productImageUrl}
                    alt={stock.productName}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                  <span>{stock.productName}</span>
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  Sin img
                </div>
              )}
            </TableCell>
            {/* <TableCell>{stock.productName || "-"}</TableCell> */}
            <TableCell>{stock.quantity || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
