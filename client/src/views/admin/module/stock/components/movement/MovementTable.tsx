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
import type { StockMovementResponse, StockMovementType } from "../../types";

type Props = {
  data: StockMovementResponse[];
  loading: boolean;
};

type MovementStyle = {
  label: string;
  badgeClassName: string;
  quantityClassName: string;
  sign: string;
};

const movementStyles: Record<StockMovementType, MovementStyle> = {
  PURCHASE: {
    label: "Compra",
    badgeClassName: "bg-emerald-100 text-emerald-700 border-emerald-200",
    quantityClassName: "text-emerald-700",
    sign: "+",
  },
  TRANSFER_IN: {
    label: "Transferencia entrada",
    badgeClassName: "bg-violet-100 text-violet-700 border-violet-200",
    quantityClassName: "text-violet-700",
    sign: "+",
  },
  ADJUSTMENT_IN: {
    label: "Ingreso por ajuste",
    badgeClassName: "bg-emerald-100 text-emerald-700 border-emerald-200",
    quantityClassName: "text-emerald-700",
    sign: "+",
  },
  SALE: {
    label: "Venta",
    badgeClassName: "bg-red-100 text-red-700 border-red-200",
    quantityClassName: "text-red-700",
    sign: "-",
  },
  TRANSFER_OUT: {
    label: "Transferencia salida",
    badgeClassName: "bg-violet-100 text-violet-700 border-violet-200",
    quantityClassName: "text-violet-700",
    sign: "-",
  },
  ADJUSTMENT_OUT: {
    label: "Egreso por ajuste",
    badgeClassName: "bg-red-100 text-red-700 border-red-200",
    quantityClassName: "text-red-700",
    sign: "-",
  },
};

const formatDate = (value: Date | string): string => {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatQuantity = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getDepositLabel = (movement: StockMovementResponse): string => {
  if (
    movement.movementType === "TRANSFER_IN" ||
    movement.movementType === "TRANSFER_OUT"
  ) {
    return `${movement.depositFromName ?? "Sin origen"} -> ${
      movement.depositToName ?? "Sin destino"
    }`;
  }

  return movement.depositToName ?? movement.depositFromName ?? "Sin deposito";
};

export const MovementTable = ({ data, loading }: Props) => {
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
        No hay movimientos registrados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Operacion</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Origen / Destino</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Observacion</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((movement) => {
          const style = movementStyles[movement.movementType];
          const imageUrl = movement.productImageUrl ?? movement.imageUrl;

          return (
            <TableRow key={movement.idStockMovement}>
              <TableCell>{formatDate(movement.createdAt)}</TableCell>
              <TableCell>
                <div className="flex min-w-56 items-center gap-2">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={movement.productName}
                      className="h-10 w-10 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                      Sin img
                    </div>
                  )}
                  <span className="font-medium">{movement.productName}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={style.badgeClassName}
                >
                  {style.label}
                </Badge>
              </TableCell>
              <TableCell className={`font-semibold ${style.quantityClassName}`}>
                {style.sign}
                {formatQuantity(movement.quantity)}
              </TableCell>
              <TableCell>{getDepositLabel(movement)}</TableCell>
              <TableCell>{movement.userName}</TableCell>
              <TableCell className="max-w-72 truncate">
                {movement.observation || "-"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
