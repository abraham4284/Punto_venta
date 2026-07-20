import { Ban } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

export const CancelPurchaseDialog = ({
  disabled = false,
  loading = false,
  onConfirm,
}: Props) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            disabled={disabled || loading}
            title="Anular compra"
          />
        }
      >
        {loading ? <Spinner className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular compra</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion revertira el stock ingresado al deposito de origen y
            dejara la compra marcada como anulada. No se podra deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirmar anulacion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
