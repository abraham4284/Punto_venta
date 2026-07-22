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
import type { DepositResponse } from "../../types/deposits.types";

type MutationResult = {
  status: boolean;
  message: string;
};

type Props = {
  data: DepositResponse[];
  loading: boolean;
  addDataEdit: (deposit: DepositResponse | null) => void;
  toggleModal: () => void;
  toggleDepositStatus: (deposit: DepositResponse) => Promise<MutationResult>;
  toggleDepositDefault: (deposit: DepositResponse) => Promise<MutationResult>;
};

export const DepositTable = ({
  data,
  loading,
  addDataEdit,
  toggleModal,
  toggleDepositStatus,
  toggleDepositDefault,
}: Props) => {
  const handleEdit = (deposit: DepositResponse) => {
    addDataEdit(deposit);
    toggleModal();
  };

  const handleToggleStatus = async (deposit: DepositResponse) => {
    await toggleDepositStatus(deposit);
  };

  const handleToggleDefault = async (deposit: DepositResponse) => {
    await toggleDepositDefault(deposit);
  };

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
          <TableHead>Nombre</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Predeterminado</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((deposit) => (
          <TableRow key={deposit.idDeposit}>
            <TableCell className="font-medium">{deposit.name}</TableCell>

            <TableCell>{deposit.description || "-"}</TableCell>

            <TableCell>
              <Badge variant={deposit.isDefault ? "default" : "secondary"}>
                {deposit.isDefault ? "Sí" : "No"}
              </Badge>
            </TableCell>

            <TableCell>
              <Badge variant={deposit.isActive ? "default" : "destructive"}>
                {deposit.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>

            <TableCell className="space-x-2 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleEdit(deposit)}
              >
                Editar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleDefault(deposit)}
              >
                {deposit.isDefault ? "Quitar pred." : "Predeterminar"}
              </Button>

              <Button
                type="button"
                variant={deposit.isActive ? "destructive" : "outline"}
                size="sm"
                onClick={() => handleToggleStatus(deposit)}
              >
                {deposit.isActive ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};