import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Eye, Filter, RefreshCcw } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import {
  emptyBusinessFilters,
  usePlatformBusinesses,
} from "../hooks/usePlatformBusinesses";
import type { PlatformBusinessFilters, PlatformBusinessListItem } from "../types";

const activityLabels: Record<string, string> = {
  ACTIVE_TODAY: "Activo hoy",
  ACTIVE_7_DAYS: "Activo 7 dias",
  ACTIVE_30_DAYS: "Activo 30 dias",
  INACTIVE_30_DAYS: "Inactivo 30 dias",
  NEVER_ACTIVATED: "Sin actividad",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  CANCELLED: "Cancelado",
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR").format(new Date(value));
};

export const PlatformBusinessesPage = () => {
  const platformRole = usePlatformAuthStore((state) => state.platformUser?.platformRole);
  const canManage = platformRole === "SUPER_ADMIN";
  const {
    businesses,
    filters,
    page,
    totalPages,
    totalRecords,
    loading,
    actionLoading,
    error,
    setPage,
    applyFilters,
    clearFilters,
    refresh,
    changeStatus,
  } = usePlatformBusinesses();
  const [localFilters, setLocalFilters] = useState<PlatformBusinessFilters>(filters);
  const [statusTarget, setStatusTarget] = useState<PlatformBusinessListItem | null>(null);
  const [reason, setReason] = useState("");

  const submitStatusChange = async () => {
    if (!statusTarget) return;

    const success = await changeStatus(statusTarget.idBusiness, !statusTarget.isActive, reason);

    if (success) {
      setStatusTarget(null);
      setReason("");
    }
  };

  return (
    <>
      <Meta title="Negocios Platform" />
      <Toaster position="top-right" reverseOrder={false} />
      <div className="grid gap-6">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 bg-cyan-50 text-cyan-700 hover:bg-cyan-50">
              Platform
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
            <p className="text-sm text-muted-foreground">
              Supervision comercial, operativa y de suscripciones por tenant.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void refresh()}>
            <RefreshCcw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refrescar
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Registros
              </CardTitle>
              <Building2 className="size-4 text-cyan-600" />
            </CardHeader>
            <CardContent className="text-3xl font-bold">{totalRecords}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {businesses.filter((business) => business.isActive).length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sin actividad
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {businesses.filter((business) => business.activity.activityStatus === "INACTIVE_30_DAYS").length}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-8">
            <div className="space-y-2 md:col-span-2">
              <Label>Buscar</Label>
              <Input
                value={localFilters.search}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, search: event.target.value })
                }
                placeholder="Nombre, slug o email"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={localFilters.businessStatus}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, businessStatus: value || "ALL" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Suscripcion</Label>
              <Select
                value={localFilters.subscriptionStatus}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, subscriptionStatus: value || "ALL" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="TRIAL">Prueba</SelectItem>
                    <SelectItem value="ACTIVE">Activa</SelectItem>
                    <SelectItem value="PAST_DUE">Vencida</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actividad</Label>
              <Select
                value={localFilters.activityStatus}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, activityStatus: value || "ALL" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="ACTIVE_TODAY">Activo hoy</SelectItem>
                    <SelectItem value="ACTIVE_7_DAYS">Activo 7 dias</SelectItem>
                    <SelectItem value="ACTIVE_30_DAYS">Activo 30 dias</SelectItem>
                    <SelectItem value="INACTIVE_30_DAYS">Inactivo</SelectItem>
                    <SelectItem value="NEVER_ACTIVATED">Sin actividad</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input
                type="date"
                value={localFilters.createdFrom}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, createdFrom: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={localFilters.createdTo}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, createdTo: event.target.value })
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" onClick={() => applyFilters(localFilters)}>
                <Filter className="size-4" />
                Aplicar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLocalFilters(emptyBusinessFilters);
                  clearFilters();
                }}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {error ? (
              <p className="p-4 text-sm text-red-600">{error}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Suscripcion</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Actividad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Alta</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9}>Cargando negocios...</TableCell>
                      </TableRow>
                    ) : businesses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9}>No se encontraron negocios.</TableCell>
                      </TableRow>
                    ) : (
                      businesses.map((business) => (
                        <TableRow key={business.idBusiness}>
                          <TableCell>
                            <div className="font-semibold">{business.name}</div>
                            <div className="text-xs text-muted-foreground">{business.slug}</div>
                          </TableCell>
                          <TableCell>
                            <div>{business.owner.name || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                              {business.owner.email || business.owner.username || "-"}
                            </div>
                          </TableCell>
                          <TableCell>{business.subscription.planName || "Sin plan"}</TableCell>
                          <TableCell>{business.subscription.status || "Sin suscripcion"}</TableCell>
                          <TableCell>
                            {business.usage.activeUsers} usuarios / {business.usage.products} productos
                          </TableCell>
                          <TableCell>
                            {activityLabels[business.activity.activityStatus]}
                          </TableCell>
                          <TableCell>
                            <Badge variant={business.isActive ? "default" : "destructive"}>
                              {statusLabels[business.businessStatus] || business.businessStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(business.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link
                                to={`/platform/businesses/${business.idBusiness}`}
                                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium"
                              >
                                <Eye className="mr-2 size-4" />
                                Ver
                              </Link>
                              {canManage ? (
                                <Button
                                  type="button"
                                  variant={business.isActive ? "destructive" : "outline"}
                                  disabled={actionLoading === business.idBusiness}
                                  onClick={() => setStatusTarget(business)}
                                >
                                  {business.isActive ? "Desactivar" : "Reactivar"}
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </Button>
        </div>

        <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {statusTarget?.isActive ? "Desactivar negocio" : "Reactivar negocio"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Esta accion actualizara el estado del negocio. Al desactivar, se revocan las sesiones BUSINESS activas.
              </p>
              <Label>Motivo</Label>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStatusTarget(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant={statusTarget?.isActive ? "destructive" : "default"}
                disabled={!reason.trim() || actionLoading === statusTarget?.idBusiness}
                onClick={() => void submitStatusChange()}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
