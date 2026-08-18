import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBusinesses } from "../../businesses/hooks/useBusinesses";
import { PurchaseDetailsView } from "../components/details/PurchaseDetailsView";
import { PurchasePrintDocument } from "../components/print/PurchasePrintDocument";
import { usePurchases } from "../hooks/usePurchases";

export const ViewPurchaseDetails = () => {
  const { idPurchase } = useParams();
  const navigate = useNavigate();
  const {
    selectedPurchase,
    loading,
    error,
    cancelingId,
    fetchPurchaseById,
    cancelPurchase,
    resetPurchases,
  } = usePurchases();
  const { business, getBusiness, resetBusiness } = useBusinesses();

  useEffect(() => {
    if (idPurchase) {
      void fetchPurchaseById(Number(idPurchase));
      void getBusiness();
    }

    return () => {
      resetPurchases();
      resetBusiness();
    };
  }, [
    fetchPurchaseById,
    getBusiness,
    idPurchase,
    resetBusiness,
    resetPurchases,
  ]);

  if (loading) {
    return (
      <>
        <Meta title="Detalle de Compra" />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Spinner />
        </main>
      </>
    );
  }

  if (error || !selectedPurchase) {
    return (
      <>
        <Meta title="Detalle de Compra" />
        <main className="space-y-4 p-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error || "Compra no encontrada"}
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Meta title="Detalle de Compra" />
      <main className="min-h-screen bg-muted/30 p-3 md:p-6 print:bg-white print:p-0">
        <div className="no-print">
          <PurchaseDetailsView
            purchase={selectedPurchase}
            canceling={cancelingId === selectedPurchase.idPurchase}
            onBack={() => navigate(-1)}
            onPrint={() => window.print()}
            onCancel={() => {
              void cancelPurchase(selectedPurchase.idPurchase);
            }}
          />
        </div>

        <div className="hidden print:block">
          <PurchasePrintDocument
            purchase={selectedPurchase}
            businessName={business?.name ?? "Punto de Venta"}
          />
        </div>
      </main>
    </>
  );
};
