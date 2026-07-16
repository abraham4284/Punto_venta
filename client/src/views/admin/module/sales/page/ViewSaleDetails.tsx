import { useEffect } from "react";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Meta } from "@/components/Meta";
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
import { useBusinesses } from "../../businesses/hooks/useBusinesses";
import { InvoiceDocument } from "../components/invoice/InvoiceDocument";
import { useSaleDetails } from "../hooks";

export const ViewSaleDetails = () => {
  const { idSale } = useParams();
  const navigate = useNavigate();
  const {
    canceling,
    cancelSaleAction,
    error,
    getSale,
    loading,
    sale,
    grossSubtotal,
    resetSaleDetails,
  } = useSaleDetails();
  const { business, getBusiness, resetBusiness } = useBusinesses();

  useEffect(() => {
    if (idSale) {
      void getSale(idSale);
      void getBusiness();
    }

    return () => {
      resetSaleDetails();
      resetBusiness();
    };
  }, [getBusiness, getSale, idSale, resetBusiness, resetSaleDetails]);

  if (loading) {
    return (
      <>
        <Meta title="Detalle de Venta" />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Spinner />
        </main>
      </>
    );
  }

  if (error || !sale) {
    return (
      <>
        <Meta title="Detalle de Venta" />
        <main className="space-y-4 bg-white p-6">
          <Button
            type="button"
            variant="outline"
            className="no-print"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error || "Venta no encontrada"}
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Meta title="Detalle de Venta" />
      <main className="min-h-screen bg-slate-100 p-3 md:p-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-5 flex max-w-[800px] flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Detalle de comprobante
          </h1>
          <p className="text-sm text-muted-foreground">
            Auditoria visual e impresion A4 de la venta {sale.saleNumber}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={canceling}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button
            type="button"
            disabled={canceling}
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Comprobante
          </Button>
          {sale.status === "CANCELLED" ? (
            <Button type="button" variant="destructive" disabled>
              <Ban className="mr-2 h-4 w-4" />
              Venta Anulada
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button type="button" variant="destructive" disabled={canceling} />
                }
              >
                {canceling ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Anular Operación
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anular venta</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Está seguro de que desea anular esta venta? Esta acción
                    revertirá el stock de los productos al depósito de origen de
                    forma automática y es irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      void cancelSaleAction(sale.idSale);
                    }}
                  >
                    Confirmar anulación
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <InvoiceDocument
        sale={sale}
        business={business}
        grossSubtotal={grossSubtotal}
      />
      </main>
    </>
  );
};
