import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CashSessionDetailModal } from "../components/CashSessionDetailModal";
import { useCash } from "../hooks/useCash";
import type {
  CashSessionFilters,
  CashSessionResponse,
  CashSessionStatus,
} from "../types";

const formatMoney = (value: number | null): string => {
  if (value === null) return "-";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
};

export const CashHistoryPage = () => {
  const {
    registers,
    history,
    filters,
    page,
    loading,
    detailLoading,
    sessionDetailSummary,
    sessionDetailMovements,
    setPage,
    refreshHistory,
    applyHistoryFilters,
    clearHistoryFilters,
    loadSessionDetail,
    clearSessionDetail,
  } = useCash();
  const [localFilters, setLocalFilters] = useState<CashSessionFilters>(filters);
  const [selectedSession, setSelectedSession] =
    useState<CashSessionResponse | null>(null);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const handleOpenDetail = async (session: CashSessionResponse) => {
    setSelectedSession(session);
    await loadSessionDetail(session.idCashSession);
  };

  const handleCloseDetail = () => {
    if (detailLoading) return;

    setSelectedSession(null);
    clearSessionDetail();
  };

  const getStatusBadge = (status: CashSessionStatus) => {
    if (status === "OPEN") {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          Abierta
        </Badge>
      );
    }

    return (
      <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">
        Cerrada
      </Badge>
    );
  };

  return (
    <>
      <Meta title="Historial de Caja" />
      <main className="space-y-6 p-2 md:p-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">Historial de caja</h1>
          <p className="text-muted-foreground">Auditoria de aperturas, cierres y diferencias.</p>
        </section>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-5">
            <div className="grid gap-2">
              <Label>Caja</Label>
              <select
                value={localFilters.idCashRegister ?? ""}
                onChange={(event) => setLocalFilters((current) => ({ ...current, idCashRegister: event.target.value ? Number(event.target.value) : null }))}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                {registers.map((register) => <option key={register.idCashRegister} value={register.idCashRegister}>{register.name}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <select
                value={localFilters.status ?? ""}
                onChange={(event) => setLocalFilters((current) => ({ ...current, status: event.target.value ? event.target.value as CashSessionStatus : null }))}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                <option value="OPEN">Abierta</option>
                <option value="CLOSED">Cerrada</option>
              </select>
            </div>
            <div className="grid gap-2"><Label>Desde</Label><Input type="date" value={localFilters.startDate} onChange={(event) => setLocalFilters((current) => ({ ...current, startDate: event.target.value }))} /></div>
            <div className="grid gap-2"><Label>Hasta</Label><Input type="date" value={localFilters.endDate} onChange={(event) => setLocalFilters((current) => ({ ...current, endDate: event.target.value }))} /></div>
            <div className="flex items-end gap-2">
              <Button type="button" onClick={() => applyHistoryFilters(localFilters)}>Aplicar</Button>
              <Button type="button" variant="outline" onClick={() => { setLocalFilters({ idCashRegister: null, idUser: null, status: null, startDate: "", endDate: "" }); clearHistoryFilters(); }}>Limpiar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Caja</th>
                  <th className="p-3 text-left">Apertura</th>
                  <th className="p-3 text-left">Cierre</th>
                  <th className="p-3 text-left">Abierta por</th>
                  <th className="p-3 text-left">Cerrada por</th>
                  <th className="p-3 text-right">Inicial</th>
                  <th className="p-3 text-right">Esperado</th>
                  <th className="p-3 text-right">Contado</th>
                  <th className="p-3 text-right">Diferencia</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">Cargando historial...</td></tr>
                ) : history.sessions.length === 0 ? (
                  <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">Sin sesiones para mostrar.</td></tr>
                ) : (
                  history.sessions.map((session) => (
                    <tr key={session.idCashSession} className="border-b">
                      <td className="p-3 font-medium">{session.cashRegisterName}</td>
                      <td className="p-3">{formatDateTime(session.openedAt)}</td>
                      <td className="p-3">{formatDateTime(session.closedAt)}</td>
                      <td className="p-3">{session.openedByUserName}</td>
                      <td className="p-3">{session.closedByUserName ?? "-"}</td>
                      <td className="p-3 text-right">{formatMoney(session.openingAmount)}</td>
                      <td className="p-3 text-right">{formatMoney(session.expectedCashAmount)}</td>
                      <td className="p-3 text-right">{formatMoney(session.countedCashAmount)}</td>
                      <td className="p-3 text-right">{formatMoney(session.differenceAmount)}</td>
                      <td className="p-3">{getStatusBadge(session.status)}</td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={detailLoading}
                          onClick={() => void handleOpenDetail(session)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Pagina {history.pagination.currentPage} de {history.pagination.totalPages}</span>
          <Button type="button" variant="outline" disabled={page >= history.pagination.totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>

        <CashSessionDetailModal
          isOpen={Boolean(selectedSession)}
          session={selectedSession}
          summary={sessionDetailSummary}
          movements={sessionDetailMovements}
          loading={detailLoading}
          onClose={handleCloseDetail}
        />
      </main>
    </>
  );
};
