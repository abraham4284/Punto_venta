import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSaleDetails } from "../hooks";
import { formatCurrency, formatDate } from "@/helpers";
import { useBusinesses } from "../../businesses/hooks/useBusinesses";

export const ViewSaleDetails = () => {
  const { idSale } = useParams();
  const navigate = useNavigate();
  const { error, getSale, loading, sale, grossSubtotal, resetSaleDetails } =
    useSaleDetails();
  const { business,getBusiness,resetBusiness } = useBusinesses();
  useEffect(() => {
    if (idSale) {
      getSale(idSale);
      getBusiness();
    }
    return () => {
      resetSaleDetails();
      resetBusiness();
    };
  }, [idSale]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (error || !sale) {
    return (
      <main className="space-y-4 bg-white p-6">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error || "Venta no encontrada"}
        </p>
      </main>
    );
  }
  return (
    <main className="bg-slate-100 p-2 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>

        <Card className="bg-white">
          <CardContent className="space-y-8 p-6 md:p-8">
            <header className="grid gap-6 border-b pb-6 md:grid-cols-2">
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800">
                    <img src={business?.logoUrl || ""} alt={business?.name || "Logo"} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{business?.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      Comprobante comercial
                    </p>
                  </div>
                </div>
                {/* <div className="text-sm text-muted-foreground">
                  <p>{business?.slug}</p>
                </div> */}
              </section>

              <section className="rounded-lg border p-4 md:text-right">
                <p className="text-sm text-muted-foreground">Operacion</p>
                <p className="text-3xl font-bold">#{sale.idSale}</p>
                <p className="mt-2 text-sm">{formatDate(sale.saleDate)}</p>
                <p className="text-sm">Deposito: {sale.depositName}</p>
                <Badge
                  variant="outline"
                  className={`mt-4 text-base ${
                    sale.status === "COMPLETED"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                      : "border-red-200 bg-red-100 text-red-700"
                  }`}
                >
                  {sale.status}
                </Badge>
              </section>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h2 className="font-semibold">Cliente</h2>
                <p className="mt-2 text-sm">
                  {sale.customerName ?? "Consumidor final"}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID cliente: {sale.idCustomer ?? "-"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h2 className="font-semibold">Vendedor</h2>
                <p className="mt-2 text-sm">{sale.userName}</p>
                <p className="text-sm text-muted-foreground">
                  Metodo de pago: {sale.paymentMethodName ?? "Sin metodo"}
                </p>
              </div>
            </section>

            <section className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio unitario</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Subtotal neto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow key={item.idSaleDetail}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.productImageUrl ? (
                            <img
                              src={item.productImageUrl}
                              alt={item.productName}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                              Sin img
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.barcode ?? "Sin codigo"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.discount)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <footer className="grid gap-4 md:grid-cols-[1fr_360px]">
              <div className="rounded-lg border p-4">
                <h2 className="font-semibold">Observaciones</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {sale.observation || "Sin observaciones asociadas."}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex justify-between py-2">
                  <span>Subtotal bruto</span>
                  <strong>{formatCurrency(grossSubtotal)}</strong>
                </div>
                <div className="flex justify-between py-2">
                  <span>Descuento total</span>
                  <strong>{formatCurrency(sale.discountTotal)}</strong>
                </div>
                <div className="mt-2 flex justify-between border-t pt-4 text-xl">
                  <span>Total general</span>
                  <strong>{formatCurrency(sale.total)}</strong>
                </div>
              </div>
            </footer>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
