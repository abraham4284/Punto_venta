import { useState } from "react";
import { Eye, Filter, ShieldAlert } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  emptyAuditFilters,
  usePlatformAudit,
} from "../hooks/usePlatformAudit";
import type { PlatformAuditFilters } from "../types";

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
};

const JsonBlock = ({ value }: { value: unknown }) => {
  return (
    <pre className="max-h-52 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
};

export const PlatformAuditPage = () => {
  const {
    logs,
    selectedLog,
    filters,
    page,
    totalPages,
    loading,
    detailLoading,
    error,
    setPage,
    setSelectedLog,
    applyFilters,
    clearFilters,
    openDetail,
  } = usePlatformAudit();
  const [localFilters, setLocalFilters] = useState<PlatformAuditFilters>(filters);

  return (
    <>
      <Meta title="Auditoria Platform" />
      <div className="grid gap-6">
        <section>
          <Badge className="mb-3 bg-cyan-50 text-cyan-700 hover:bg-cyan-50">
            Platform
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Auditoria Platform</h1>
          <p className="text-sm text-muted-foreground">
            Registro de acciones internas administrativas.
          </p>
        </section>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-8">
            <div className="space-y-2 md:col-span-2">
              <Label>Accion</Label>
              <Input
                value={localFilters.action}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, action: event.target.value })
                }
                placeholder="BUSINESS_STATUS_CHANGED"
              />
            </div>
            <div className="space-y-2">
              <Label>Entidad</Label>
              <Input
                value={localFilters.entityType}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, entityType: event.target.value })
                }
                placeholder="BUSINESS"
              />
            </div>
            <div className="space-y-2">
              <Label>ID entidad</Label>
              <Input
                value={localFilters.entityId}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, entityId: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>ID negocio</Label>
              <Input
                value={localFilters.idBusiness}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, idBusiness: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input
                type="date"
                value={localFilters.dateFrom}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, dateFrom: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={localFilters.dateTo}
                onChange={(event) =>
                  setLocalFilters({ ...localFilters, dateTo: event.target.value })
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
                  setLocalFilters(emptyAuditFilters);
                  clearFilters();
                }}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="overflow-x-auto p-0">
            {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Accion</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Cargando auditoria...</TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No hay registros de auditoria.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.idPlatformAuditLog}>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{log.actor.name}</div>
                        <div className="text-xs text-muted-foreground">{log.actor.role}</div>
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        {log.entityType}
                        {log.entityId ? ` #${log.entityId}` : ""}
                      </TableCell>
                      <TableCell>{log.business.name || "-"}</TableCell>
                      <TableCell>{log.ipAddress || "-"}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={detailLoading}
                          onClick={() => void openDetail(log.idPlatformAuditLog)}
                        >
                          <Eye className="size-4" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>

        <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5" />
                Detalle de auditoria
              </DialogTitle>
            </DialogHeader>
            {selectedLog ? (
              <div className="grid gap-4">
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <p><strong>Actor:</strong> {selectedLog.actor.name}</p>
                  <p><strong>Accion:</strong> {selectedLog.action}</p>
                  <p><strong>Entidad:</strong> {selectedLog.entityType}</p>
                  <p><strong>User Agent:</strong> {selectedLog.userAgent || "-"}</p>
                </div>
                <div>
                  <Label>Datos anteriores</Label>
                  <JsonBlock value={selectedLog.previousData} />
                </div>
                <div>
                  <Label>Datos nuevos</Label>
                  <JsonBlock value={selectedLog.newData} />
                </div>
                <div>
                  <Label>Metadata</Label>
                  <JsonBlock value={selectedLog.metadata} />
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
