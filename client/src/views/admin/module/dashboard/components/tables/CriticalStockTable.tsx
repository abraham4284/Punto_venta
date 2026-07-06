import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CriticalStockItem } from "../../types";

type Props = {
  items: CriticalStockItem[];
};

export const CriticalStockTable = ({ items }: Props) => {
  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold">Stock critico por deposito</h2>
        <p className="text-sm text-muted-foreground">
          Productos que requieren reposicion o control
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay productos en alerta critica.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deposito</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Minimo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isOut = item.currentStock === 0;

              return (
                <TableRow key={`${item.idDeposit}-${item.idProduct}`}>
                  <TableCell>{item.depositName}</TableCell>
                  <TableCell className="font-medium">
                    {item.productName}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.currentStock}
                  </TableCell>
                  <TableCell className="text-right">{item.stockMin}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        isOut
                          ? "border-red-200 bg-red-100 text-red-700"
                          : "border-amber-200 bg-amber-100 text-amber-700"
                      }
                    >
                      {isOut ? "Sin stock" : "Stock bajo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </article>
  );
};
