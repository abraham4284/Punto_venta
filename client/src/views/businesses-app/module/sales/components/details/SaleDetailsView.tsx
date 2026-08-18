import {
  ArrowLeft,
  Ban,
  CreditCard,
  Package,
  Printer,
  Receipt,
  User,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/helpers";
import {
  OperationMetricCard,
  OperationTotals,
  ProductThumbnail,
} from "@/views/businesses-app/components/operation-details";
import type { Customer } from "../../../customers/types/customers.types";
import type { SaleWithDetailsResponse } from "../../types";

type SaleDetailsViewProps = {
  sale: SaleWithDetailsResponse;
  customer: Customer | null;
  customerLoading: boolean;
  grossSubtotal: number;
  canceling: boolean;
  onBack: () => void;
  onPrint: () => void;
  onCancel: () => void;
};

const getSaleStatusLabel = (status: SaleWithDetailsResponse["status"]) => {
  return status === "CANCELLED" ? "Anulada" : "Completada";
};

const getSaleStatusVariant = (status: SaleWithDetailsResponse["status"]) => {
  return status === "CANCELLED" ? "destructive" : "secondary";
};

const formatQuantity = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
};

const InfoItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
};

export const SaleDetailsView = ({
  sale,
  customer,
  customerLoading,
  grossSubtotal,
  canceling,
  onBack,
  onPrint,
  onCancel,
}: SaleDetailsViewProps) => {
  const saleNumber = sale.saleNumber || `#${sale.idSale}`;
  const customerName =
    customer?.name || sale.customerName || "Consumidor final";
  const itemsCount = sale.items.length;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Venta #{saleNumber}
              </h1>
              <Badge variant={getSaleStatusVariant(sale.status)}>
                {getSaleStatusLabel(sale.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(sale.saleDate)} · Información completa de la
              operación registrada.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:pt-10">
          <Button type="button" disabled={canceling} onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir comprobante
          </Button>
          {sale.status === "CANCELLED" ? (
            <Button type="button" variant="destructive" disabled>
              <Ban className="mr-2 h-4 w-4" />
              Venta anulada
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={canceling}
                  />
                }
              >
                {canceling ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Anular venta
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
                  <AlertDialogCancel disabled={canceling}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction disabled={canceling} onClick={onCancel}>
                    Confirmar anulación
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      {sale.status === "CANCELLED" ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="text-sm text-destructive">
            Esta venta fue anulada y el stock fue restaurado.
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperationMetricCard
          title="Total"
          value={formatCurrency(sale.total)}
          subtitle="Importe neto"
          icon={Receipt}
        />
        <OperationMetricCard
          title="Ítems"
          value={itemsCount}
          subtitle="Líneas de productos"
          icon={Package}
        />
        <OperationMetricCard
          title="Medio de pago"
          value={sale.paymentMethodName ?? "Sin informar"}
          subtitle={sale.paymentMethodCode ?? undefined}
          icon={CreditCard}
        />
        <OperationMetricCard
          title="Cliente"
          value={customerName}
          subtitle={sale.idCustomer ? "Cliente registrado" : "Venta mostrador"}
          icon={User}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio unitario</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay productos registrados en esta operación.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sale.items.map((item) => (
                      <TableRow key={item.idSaleDetail}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProductThumbnail
                              imageUrl={item.productImageUrl}
                              name={item.productName}
                            />
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.barcode || "Sin código"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatQuantity(item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.discount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <OperationTotals
            subtotal={grossSubtotal}
            discountTotal={sale.discountTotal}
            total={sale.total}
          />

          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customerLoading ? (
                <p className="text-muted-foreground">Cargando datos...</p>
              ) : sale.idCustomer && customer ? (
                <>
                  <p className="font-semibold">{customer.name}</p>
                  {customer.phone ? <p>Teléfono: {customer.phone}</p> : null}
                  {customer.email ? <p>Email: {customer.email}</p> : null}
                  {customer.address ? (
                    <p>Dirección: {customer.address}</p>
                  ) : null}
                  {customer.observation ? (
                    <p className="text-muted-foreground">
                      {customer.observation}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="font-semibold">Consumidor final</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de la operación</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <InfoItem label="Número de venta" value={saleNumber} />
              <InfoItem label="Fecha" value={formatDate(sale.saleDate)} />
              <InfoItem label="Depósito" value={sale.depositName} />
              <InfoItem label="Vendedor" value={sale.userName} />
              <InfoItem
                label="Método de pago"
                value={sale.paymentMethodName ?? "Sin informar"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {sale.observation || "Sin observaciones"}
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </section>
  );
};
