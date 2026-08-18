import {
  ArrowLeft,
  Ban,
  Package,
  Printer,
  Receipt,
  Truck,
  Warehouse,
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
import { getPurchaseStatusLabel } from "../../data/purchaseStatus.data";
import type { PurchaseWithDetailsResponse } from "../../types";

type PurchaseDetailsViewProps = {
  purchase: PurchaseWithDetailsResponse;
  canceling: boolean;
  onBack: () => void;
  onPrint: () => void;
  onCancel: () => void;
};

const getStatusVariant = (status: PurchaseWithDetailsResponse["status"]) => {
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

export const PurchaseDetailsView = ({
  purchase,
  canceling,
  onBack,
  onPrint,
  onCancel,
}: PurchaseDetailsViewProps) => {
  const supplierName =
    purchase.supplierName || "Sin proveedor / Ingreso directo";
  const purchaseNumber = purchase.purchaseNumber || `#${purchase.idPurchase}`;
  const depositNames = Array.from(
    new Set(
      purchase.details
        .map((detail) => detail.depositName)
        .filter((depositName) => Boolean(depositName)),
    ),
  );
  const depositMetricValue =
    depositNames.length <= 1
      ? depositNames[0] || purchase.depositName || "Sin depósito"
      : `${depositNames.length} depósitos`;

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
                Compra #{purchaseNumber}
              </h1>
              <Badge variant={getStatusVariant(purchase.status)}>
                {getPurchaseStatusLabel(purchase.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(purchase.purchaseDate)} · Información completa del
              ingreso registrado.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:pt-10">
          <Button type="button" disabled={canceling} onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir comprobante
          </Button>
          {purchase.status === "CANCELLED" ? (
            <Button type="button" variant="destructive" disabled>
              <Ban className="mr-2 h-4 w-4" />
              Compra anulada
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
                Anular compra
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anular compra</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción revertirá el stock ingresado al depósito de
                    origen y dejará la compra marcada como anulada. No se podrá
                    deshacer.
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

      {purchase.status === "CANCELLED" ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="text-sm text-destructive">
            Esta compra fue anulada y el stock ingresado fue revertido.
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperationMetricCard
          title="Total"
          value={formatCurrency(purchase.total)}
          subtitle="Importe neto"
          icon={Receipt}
        />
        <OperationMetricCard
          title="Ítems"
          value={purchase.details.length}
          subtitle="Líneas de productos"
          icon={Package}
        />
        <OperationMetricCard
          title="Proveedor"
          value={supplierName}
          subtitle={purchase.idSupplier ? "Proveedor registrado" : "Ingreso directo"}
          icon={Truck}
        />
        <OperationMetricCard
          title={depositNames.length > 1 ? "Depósitos" : "Depósito"}
          value={depositMetricValue}
          subtitle="Destino de mercadería"
          icon={Warehouse}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Depósito</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo unitario</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.details.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay productos registrados en esta operación.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchase.details.map((detail) => (
                      <TableRow key={detail.idPurchaseDetail}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProductThumbnail
                              imageUrl={detail.productImageUrl}
                              name={detail.productName}
                            />
                            <div>
                              <p className="font-medium">
                                {detail.productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {detail.barcode || "Sin código"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{detail.depositName}</TableCell>
                        <TableCell className="text-right">
                          {formatQuantity(detail.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(detail.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(detail.discountAmount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(detail.subtotal)}
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
            subtotal={purchase.subtotal}
            discountTotal={purchase.discountTotal}
            total={purchase.total}
          />

          <Card>
            <CardHeader>
              <CardTitle>Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">{supplierName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de la operación</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <InfoItem label="Número de compra" value={purchaseNumber} />
              <InfoItem
                label="Fecha"
                value={formatDate(purchase.purchaseDate)}
              />
              <InfoItem label="Usuario" value={purchase.userName} />
              <InfoItem
                label="Estado"
                value={getPurchaseStatusLabel(purchase.status)}
              />
              <InfoItem label="Depósitos" value={depositMetricValue} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {purchase.observation || "Sin observaciones"}
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </section>
  );
};
