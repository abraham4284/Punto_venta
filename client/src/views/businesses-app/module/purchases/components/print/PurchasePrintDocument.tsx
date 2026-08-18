import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/helpers";
import { getPurchaseStatusLabel } from "../../data/purchaseStatus.data";
import type { PurchaseWithDetailsResponse } from "../../types";

type PurchasePrintDocumentProps = {
  purchase: PurchaseWithDetailsResponse;
  businessName: string;
};

const formatQuantity = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
};

export const PurchasePrintDocument = ({
  purchase,
  businessName,
}: PurchasePrintDocumentProps) => {
  const supplierName =
    purchase.supplierName || "Sin proveedor / Ingreso directo";

  return (
    <Card className="print-container relative mx-auto max-w-[800px] overflow-hidden bg-white p-0 shadow-lg print:max-w-full print:border-0 print:shadow-none">
      {purchase.status === "CANCELLED" ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="-rotate-12 rounded-lg border-4 border-destructive px-8 py-3 text-5xl font-black uppercase text-destructive/25">
            Anulada
          </span>
        </div>
      ) : null}

      <div className="bg-emerald-700 px-8 py-8 text-white print:bg-emerald-700">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              Comprobante de compra
            </p>
            <h2 className="mt-2 text-3xl font-bold">{businessName}</h2>
            <p className="mt-1 text-white/80">
              Ingreso de mercadería y control de stock
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-white/70">Operación</p>
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
          </section>

          <section className="rounded-lg border p-4 md:text-right">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
              Datos de operación
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
                <th className="p-3 text-left">Depósito</th>
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
                    <div className="flex items-center gap-2">
                      {detail.productImageUrl ? (
                        <img
                          src={detail.productImageUrl}
                          alt={detail.productName}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{detail.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {detail.barcode || "Sin código"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{detail.depositName}</td>
                  <td className="p-3 text-right">
                    {formatQuantity(detail.quantity)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(detail.unitPrice)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(detail.discountAmount)}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(detail.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Observación</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {purchase.observation || "Sin observaciones"}
            </p>
          </div>

          <div className="grid gap-2 rounded-lg bg-muted/40 p-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <strong>{formatCurrency(purchase.subtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Descuento</span>
              <strong>{formatCurrency(purchase.discountTotal)}</strong>
            </div>
            <div className="flex justify-between border-t pt-3 text-xl">
              <span>Total</span>
              <strong>{formatCurrency(purchase.total)}</strong>
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
