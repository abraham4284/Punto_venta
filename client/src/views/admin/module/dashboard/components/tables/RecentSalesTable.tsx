import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecentSale } from "../../types";

type Props = {
  sales: RecentSale[];
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value: Date | string): string => {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const RecentSalesTable = ({ sales }: Props) => {
  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold">Ultimas ventas</h2>
        <p className="text-sm text-muted-foreground">
          Auditoria rapida de comprobantes recientes
        </p>
      </div>

      {sales.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Todavia no hay ventas registradas.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nro.</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.idSale}>
                <TableCell className="font-medium">
                  #{sale.receiptNumber}
                </TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>{formatMoney(sale.total)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      sale.status === "COMPLETED"
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "border-red-200 bg-red-100 text-red-700"
                    }
                  >
                    {sale.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(sale.saleDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </article>
  );
};
