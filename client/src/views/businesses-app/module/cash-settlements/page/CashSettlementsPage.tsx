import { useMemo, useState } from "react";
import { Banknote, Loader2, Search } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessUsers } from "../../business-users/hooks/useBusinessUsers";
import { useCash } from "../../cash/hooks/useCash";
import { useCashSettlements } from "../hooks/useCashSettlements";

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const CashSettlementsPage = () => {
  const { users } = useBusinessUsers();
  const { currentSession } = useCash();
  const {
    settlements,
    pagination,
    loading,
    saving,
    createSettlement,
    changePage,
  } = useCashSettlements();
  const [collectorUserId, setCollectorUserId] = useState<number | null>(null);
  const [observation, setObservation] = useState("");

  const collectorOptions = useMemo(() => {
    return users.filter((user) => user.isActive && user.role !== "OWNER");
  }, [users]);

  const selectedCollectorName = useMemo(() => {
    return collectorOptions.find((user) => user.idUser === collectorUserId)?.name ?? "";
  }, [collectorOptions, collectorUserId]);

  const handleCreateSettlement = async () => {
    if (!collectorUserId || !currentSession?.idCashSession) return;

    const result = await createSettlement({
      collectorUserId,
      idCashSession: currentSession.idCashSession,
      observation: observation.trim() || null,
    });

    if (result) {
      setCollectorUserId(null);
      setObservation("");
    }
  };

  return (
    <>
      <Meta title="Liquidaciones de efectivo" />
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Caja y delivery</p>
          <h1 className="text-2xl font-bold tracking-tight">Liquidaciones de efectivo</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Registrá el efectivo cobrado por cadetes y confirmalo dentro de la caja abierta.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="size-4" />
              Nueva liquidación
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[260px_1fr_auto]">
            <Select
              value={collectorUserId ? String(collectorUserId) : ""}
              onValueChange={(value) =>
                setCollectorUserId(value ? Number(value) : null)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cadete">
                  {selectedCollectorName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {collectorOptions.map((user) => (
                  <SelectItem key={user.idUser} value={String(user.idUser)}>
                    {user.name} · {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="Observación interna"
              className="min-h-10"
            />
            <Button
              type="button"
              disabled={!collectorUserId || !currentSession?.idCashSession || saving}
              onClick={() => void handleCreateSettlement()}
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Liquidar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="size-4" />
              Historial de liquidaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-3">N°</th>
                  <th className="py-3 pr-3">Cadete</th>
                  <th className="py-3 pr-3">Recibió</th>
                  <th className="py-3 pr-3">Caja</th>
                  <th className="py-3 pr-3">Fecha</th>
                  <th className="py-3 pr-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      Cargando liquidaciones...
                    </td>
                  </tr>
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      No hay liquidaciones registradas.
                    </td>
                  </tr>
                ) : (
                  settlements.map((settlement) => (
                    <tr key={settlement.idCashSettlement} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium">#{settlement.idCashSettlement}</td>
                      <td className="py-3 pr-3">{settlement.collectorUserName}</td>
                      <td className="py-3 pr-3">{settlement.receivedByUserName}</td>
                      <td className="py-3 pr-3">Caja #{settlement.idCashSession}</td>
                      <td className="py-3 pr-3">{formatDate(settlement.settledAt)}</td>
                      <td className="py-3 pr-3 text-right font-semibold">
                        {formatMoney(settlement.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {pagination.totalRecords} liquidaciones
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
