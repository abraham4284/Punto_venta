import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBusinesses } from "../../businesses/hooks/useBusinesses";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { SaleDetailsView } from "../components/details/SaleDetailsView";
import { SalePrintDocument } from "../components/print/SalePrintDocument";
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
  const { customerById, loadingById, getIdCustomers, resetIdCustomers } =
    useCustomers();

  useEffect(() => {
    if (idSale) {
      void getSale(idSale);
      void getBusiness();
    }

    return () => {
      resetSaleDetails();
      resetBusiness();
      resetIdCustomers();
    };
  }, [
    getBusiness,
    getSale,
    idSale,
    resetBusiness,
    resetIdCustomers,
    resetSaleDetails,
  ]);

  useEffect(() => {
    if (sale?.idCustomer) {
      void getIdCustomers(sale.idCustomer);
      return;
    }

    resetIdCustomers();
  }, [getIdCustomers, resetIdCustomers, sale?.idCustomer]);

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
      <main className="min-h-screen bg-muted/30 p-3 md:p-6 print:bg-white print:p-0">
        <div className="no-print">
          <SaleDetailsView
            sale={sale}
            customer={customerById}
            customerLoading={loadingById}
            grossSubtotal={grossSubtotal}
            canceling={canceling}
            onBack={() => navigate(-1)}
            onPrint={() => window.print()}
            onCancel={() => {
              void cancelSaleAction(sale.idSale);
            }}
          />
        </div>

        <div className="hidden print:block">
          <SalePrintDocument
            sale={sale}
            business={business}
            customer={customerById}
            grossSubtotal={grossSubtotal}
          />
        </div>
      </main>
    </>
  );
};
