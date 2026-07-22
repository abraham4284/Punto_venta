import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierResponse } from "../../types";

type Props = {
  suppliers: SupplierResponse[];
  loading: boolean;
  onEdit: (supplier: SupplierResponse) => void;
  onToggleStatus: (supplier: SupplierResponse) => void;
};

export const SupplierTable = ({
  suppliers,
  loading,
  onEdit,
  onToggleStatus,
}: Props) => {
  if (loading) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        Cargando proveedores...
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        No hay proveedores registrados.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proveedor</TableHead>
            <TableHead>Telefono</TableHead>
            <TableHead>Correo Electronico</TableHead>
            <TableHead>Direccion</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.idSupplier}>
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>{supplier.phone || "-"}</TableCell>
              <TableCell>{supplier.email || "-"}</TableCell>
              <TableCell>{supplier.address || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={supplier.isActive}
                    onCheckedChange={() => onToggleStatus(supplier)}
                    aria-label={`Cambiar estado de ${supplier.name}`}
                  />
                  <Badge
                    variant={supplier.isActive ? "default" : "destructive"}
                  >
                    {supplier.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(supplier)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
