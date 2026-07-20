import { useEffect } from "react";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useBusinesses } from "../../businesses/hooks/useBusinesses";
import { CancelPurchaseDialog } from "../components/modal/CancelPurchaseDialog";
import { getPurchaseStatusLabel } from "../data/purchaseStatus.data";
import { usePurchases } from "../hooks/usePurchases";
import type { PurchaseWithDetailsResponse } from "../types";

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value: Date | string): string => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

type DocumentProps = {
  purchase: PurchaseWithDetailsResponse;
  businessName: string;
};

const PurchaseDocument = ({ purchase, businessName }: DocumentProps) => {
  const supplierName = purchase.supplierName || "Sin Proveedor / Ingreso Directo";

  return (
    <Card className="print-container relative mx-auto max-w-[800px] overflow-hidden bg-white p-0 shadow-lg print:max-w-full print:border-0 print:shadow-none">
      {purchase.status === "CANCELLED" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="-rotate-12 rounded-lg border-4 border-destructive px-8 py-3 text-5xl font-black uppercase text-destructive/25">
            Anulada
          </span>
        </div>
      )}

      <div className="bg-emerald-700 px-8 py-8 text-white print:bg-emerald-700">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              Comprobante de compra
            </p>
            <h2 className="mt-2 text-3xl font-bold">{businessName}</h2>
            <p className="mt-1 text-white/80">
              Ingreso de mercaderia y auditoria de stock
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-white/70">Operacion</p>
            <p className="text-xl font-bold">{purchase.purchaseNumber}</p>
            <Badge variant="secondary" className="mt-2">
              {getPurchaseStatusLabel(purchase.status)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-8 p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
              Proveedor
            </h3>
            <p>
              <strong>Nombre:</strong> {supplierName}
            </p>
            <p>
              <strong>Deposito:</strong> {purchase.depositName}
            </p>
          </section>

          <section className="rounded-lg border p-4 md:text-right">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
              Datos de operacion
            </h3>
            <p>
              <strong>Fecha:</strong> {formatDate(purchase.purchaseDate)}
            </p>
            <p>
              <strong>Usuario:</strong> {purchase.userName}
            </p>
          </section>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-900 text-white print:bg-emerald-900">
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Deposito</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3 text-right">Costo</th>
                <th className="p-3 text-right">Descuento</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.details.map((detail) => (
                <tr key={detail.idPurchaseDetail} className="border-b">
                  <td className="p-3">
                    <p className="font-medium">{detail.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {detail.barcode || "Sin codigo"}
                    </p>
                  </td>
                  <td className="p-3">{detail.depositName}</td>
                  <td className="p-3 text-right">{detail.quantity}</td>
                  <td className="p-3 text-right">
                    {formatMoney(detail.unitPrice)}
                  </td>
                  <td className="p-3 text-right">
                    {formatMoney(detail.discountAmount)}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatMoney(detail.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Observacion</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {purchase.observation || "Sin observaciones"}
            </p>
          </div>

          <div className="grid gap-2 rounded-lg bg-muted/40 p-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <strong>{formatMoney(purchase.subtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Descuento</span>
              <strong>{formatMoney(purchase.discountTotal)}</strong>
            </div>
            <div className="flex justify-between border-t pt-3 text-xl">
              <span>Total</span>
              <strong>{formatMoney(purchase.total)}</strong>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-64 border-t pt-2 text-center font-semibold">
            Responsable autorizado
          </div>
        </div>
      </div>
    </Card>
  );
};

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
      <main className="min-h-screen bg-slate-100 p-3 md:p-6 print:bg-white print:p-0">
        <div className="no-print mx-auto mb-5 flex max-w-[800px] flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Detalle de compra
            </h1>
            <p className="text-sm text-muted-foreground">
              Auditoria del ingreso {selectedPurchase.purchaseNumber}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button type="button" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            {selectedPurchase.status === "CANCELLED" ? (
              <Button type="button" variant="destructive" disabled>
                <Ban className="mr-2 h-4 w-4" />
                Compra anulada
              </Button>
            ) : (
              <CancelPurchaseDialog
                loading={cancelingId === selectedPurchase.idPurchase}
                onConfirm={() => void cancelPurchase(selectedPurchase.idPurchase)}
              />
            )}
          </div>
        </div>

        <PurchaseDocument
          purchase={selectedPurchase}
          businessName={business?.name ?? "Punto de Venta"}
        />
      </main>
    </>
  );
};
