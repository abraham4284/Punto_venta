import { useState } from "react";
import { CheckCircle2, Loader2, PackageCheck, Search, Truck, XCircle } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeliveries } from "../hooks/useDeliveries";
import type { DeliveryStatus } from "../types";

const statusLabels: Record<DeliveryStatus, string> = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregada",
  FAILED: "Fallida",
  CANCELLED: "Cancelada",
};

const statusClassNames: Record<DeliveryStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  OUT_FOR_DELIVERY: "bg-violet-50 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

const formatDate = (value: string | null): string => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const DeliveriesPage = () => {
  const {
    deliveries,
    filters,
    pagination,
    loading,
    actionLoadingId,
    applyFilters,
    changePage,
    startDelivery,
    deliverDelivery,
    cancelDelivery,
  } = useDeliveries();
  const [search, setSearch] = useState(filters.search);
  const [status, setStatus] = useState<DeliveryStatus | "">(filters.status);

  const handleApplyFilters = () => {
    applyFilters({
      search,
      status,
      assignedToUserId: null,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    applyFilters({
      search: "",
      status: "",
      assignedToUserId: null,
    });
  };

  return (
    <>
      <Meta title="Entregas" />
      <section className="space-y-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Operación diaria</p>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de entregas</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Controlá pedidos pendientes, asignados y cobrados por cadete.
          </p>
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por venta, destinatario o direccion"
              />
            </div>
            <Select
              value={status || ""}
              onValueChange={(value) => setStatus((value || "") as DeliveryStatus | "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="ASSIGNED">Asignada</SelectItem>
                <SelectItem value="OUT_FOR_DELIVERY">En camino</SelectItem>
                <SelectItem value="DELIVERED">Entregada</SelectItem>
                <SelectItem value="FAILED">Fallida</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={handleApplyFilters}>
              Aplicar filtros
            </Button>
            <Button type="button" variant="outline" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4" />
              Historial operativo
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-3">Venta</th>
                  <th className="py-3 pr-3">Destinatario</th>
                  <th className="py-3 pr-3">Dirección</th>
                  <th className="py-3 pr-3">Referencia</th>
                  <th className="py-3 pr-3">Cadete</th>
                  <th className="py-3 pr-3">Programada</th>
                  <th className="py-3 pr-3">Total</th>
                  <th className="py-3 pr-3">Estado</th>
                  <th className="py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-muted-foreground">
                      Cargando entregas...
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-muted-foreground">
                      No hay entregas para mostrar.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((delivery) => {
                    const isLoading = actionLoadingId === delivery.idSaleDelivery;
                    const isFinal = ["DELIVERED", "FAILED", "CANCELLED"].includes(
                      delivery.status,
                    );

                    return (
                      <tr key={delivery.idSaleDelivery} className="border-b last:border-0">
                        <td className="py-3 pr-3 font-medium">{delivery.saleNumber}</td>
                        <td className="py-3 pr-3">{delivery.recipientName}</td>
                        <td className="py-3 pr-3">{delivery.deliveryAddress}</td>
                        <td className="py-3 pr-3">{delivery.deliveryReference ?? "-"}</td>
                        <td className="py-3 pr-3">{delivery.assignedUserName ?? "-"}</td>
                        <td className="py-3 pr-3">{formatDate(delivery.scheduledAt)}</td>
                        <td className="py-3 pr-3 font-semibold">{formatMoney(delivery.total)}</td>
                        <td className="py-3 pr-3">
                          <Badge className={statusClassNames[delivery.status]}>
                            {statusLabels[delivery.status]}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-2">
                            {isLoading ? (
                              <Button size="sm" variant="outline" disabled>
                                <Loader2 className="size-4 animate-spin" />
                              </Button>
                            ) : isFinal ? (
                              <Button size="sm" variant="outline" disabled>
                                Finalizada
                              </Button>
                            ) : (
                              <>
                                {delivery.status === "ASSIGNED" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void startDelivery(delivery.idSaleDelivery)}
                                  >
                                    <PackageCheck className="mr-1 size-4" />
                                    Iniciar
                                  </Button>
                                )}
                                {delivery.status === "OUT_FOR_DELIVERY" && (
                                  <Button
                                    size="sm"
                                    onClick={() => void deliverDelivery(delivery.idSaleDelivery)}
                                  >
                                    <CheckCircle2 className="mr-1 size-4" />
                                    Entregar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => void cancelDelivery(delivery.idSaleDelivery)}
                                >
                                  <XCircle className="mr-1 size-4" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {pagination.totalRecords} entregas encontradas
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => changePage(pagination.currentPage - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm font-medium">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => changePage(pagination.currentPage + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
};
