import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentMethodTypeLabels } from "../helpers/payment-method.helpers";
import type { MutationResult, PaymentMethodResponse } from "../types";

interface PaymentMethodTableProps {
  data: PaymentMethodResponse[];
  loading: boolean;
  saving: boolean;
  onEdit: (paymentMethod: PaymentMethodResponse) => void;
  onToggleStatus: (paymentMethod: PaymentMethodResponse) => Promise<MutationResult>;
  onSetDefault: (paymentMethod: PaymentMethodResponse) => Promise<MutationResult>;
}

export const PaymentMethodTable = ({
  data,
  loading,
  saving,
  onEdit,
  onToggleStatus,
  onSetDefault,
}: PaymentMethodTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No hay metodos de pago registrados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metodo</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Impacta caja</TableHead>
          <TableHead>Predeterminado</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Uso historico</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((paymentMethod) => {
          const isSystemCash = paymentMethod.code === "CASH";

          return (
            <TableRow key={paymentMethod.idPaymentMethod}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-semibold">{paymentMethod.name}</p>
                  {isSystemCash && (
                    <Badge variant="secondary">Metodo del sistema</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{paymentMethodTypeLabels[paymentMethod.code]}</TableCell>
              <TableCell>
                <Badge variant={paymentMethod.affectsCash ? "default" : "outline"}>
                  {paymentMethod.affectsCash ? "Si" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={paymentMethod.isDefault ? "default" : "secondary"}>
                  {paymentMethod.isDefault ? "Si" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={paymentMethod.isActive ? "default" : "destructive"}>
                  {paymentMethod.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>{paymentMethod.salesCount}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {!isSystemCash && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => onEdit(paymentMethod)}
                    >
                      Editar
                    </Button>
                  )}

                  {!paymentMethod.isDefault && paymentMethod.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                          />
                        }
                      >
                        Predeterminar
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Marcar metodo predeterminado
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Este metodo quedara preseleccionado al registrar una
                            nueva venta.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              void onSetDefault(paymentMethod);
                            }}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {!isSystemCash && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            type="button"
                            variant={
                              paymentMethod.isActive ? "destructive" : "outline"
                            }
                            size="sm"
                            disabled={saving}
                          />
                        }
                      >
                        {paymentMethod.isActive ? "Desactivar" : "Activar"}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {paymentMethod.isActive
                              ? "Desactivar metodo"
                              : "Activar metodo"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Los metodos desactivados se mantienen en ventas
                            historicas, pero no aparecen en nuevas ventas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              void onToggleStatus(paymentMethod);
                            }}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
