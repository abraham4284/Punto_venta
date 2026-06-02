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
import type { Customer } from "../../types/customers.types";

interface Props {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onToggleStatus: (customer: Customer) => void;
}

export const CustomersTable = ({
  customers,
  loading,
  onEdit,
  onToggleStatus,
}: Props) => {
  if (loading) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        Cargando clientes...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        No hay clientes registrados.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.idCustomer}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.phone || "-"}</TableCell>
              <TableCell>{customer.email || "-"}</TableCell>
              <TableCell>{customer.address || "-"}</TableCell>
              <TableCell>
                <Badge variant={customer.isActive ? "default" : "destructive"}>
                  {customer.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(customer)}
                  >
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant={customer.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => onToggleStatus(customer)}
                  >
                    {customer.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};