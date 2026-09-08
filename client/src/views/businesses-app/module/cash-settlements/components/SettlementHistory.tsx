import { useMemo, useState } from "react";
import { Eye, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatSettlementDate,
  formatSettlementMoney,
} from "../helpers/cash-settlement.helpers";
import type {
  CashSettlementFilters,
  CashSettlementPagination,
  CashSettlementResponse,
  PendingCashSettlementCollectorResponse,
} from "../types";
import { SettlementPagination } from "./SettlementPagination";

type SettlementHistoryProps = {
  settlements: CashSettlementResponse[];
  pendingCollectors: PendingCashSettlementCollectorResponse[];
  filters: CashSettlementFilters;
  pagination: CashSettlementPagination;
  loading: boolean;
  error: string | null;
  onApplyFilters: (filters: CashSettlementFilters) => void;
  onClearFilters: () => void;
  onChangePage: (page: number) => void;
  onRetry: () => void;
};

export const SettlementHistory = ({
  settlements,
  pendingCollectors,
  filters,
  pagination,
  loading,
  error,
  onApplyFilters,
  onClearFilters,
  onChangePage,
  onRetry,
}: SettlementHistoryProps) => {
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] =
    useState<CashSettlementFilters>(filters);
  const collectorOptions = useMemo(() => {
    const collectors = new Map<number, string>();

    for (const collector of pendingCollectors) {
      collectors.set(collector.collectorUserId, collector.collectorUserName);
    }

    for (const settlement of settlements) {
      collectors.set(settlement.collectorUserId, settlement.collectorUserName);
    }

    return Array.from(collectors.entries()).map(([collectorUserId, name]) => ({
      collectorUserId,
      name,
    }));
  }, [pendingCollectors, settlements]);
  const selectedCollectorName = useMemo(() => {
    if (!draftFilters.collectorUserId) return "Todos los cadetes";

    return (
      collectorOptions.find((collector) => {
        return collector.collectorUserId === draftFilters.collectorUserId;
      })?.name ?? "Cadete seleccionado"
    );
  }, [collectorOptions, draftFilters.collectorUserId]);

  const handleClear = () => {
    const emptyFilters: CashSettlementFilters = {
      collectorUserId: null,
      startDate: "",
      endDate: "",
    };

    setDraftFilters(emptyFilters);
    onClearFilters();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="size-4" />
          Historial de rendiciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto] lg:items-end">
          <div className="grid gap-2">
            <Label>Cadete</Label>
            <Select
              value={
                draftFilters.collectorUserId
                  ? String(draftFilters.collectorUserId)
                  : "ALL"
              }
              onValueChange={(value: string | null) => {
                setDraftFilters((current) => ({
                  ...current,
                  collectorUserId: value && value !== "ALL" ? Number(value) : null,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <span className="flex flex-1 text-left">{selectedCollectorName}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los cadetes</SelectItem>
                {collectorOptions.map((collector) => (
                  <SelectItem
                    key={collector.collectorUserId}
                    value={String(collector.collectorUserId)}
                  >
                    {collector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Desde</Label>
            <Input
              type="date"
              value={draftFilters.startDate}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={draftFilters.endDate}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
            />
          </div>
          <Button type="button" onClick={() => onApplyFilters(draftFilters)}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
            <RotateCcw className="mr-2 size-4" />
            Limpiar
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Cadete</TableHead>
                <TableHead>Recibió</TableHead>
                <TableHead>Caja</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Spinner />
                      Cargando rendiciones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : settlements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No hay rendiciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((settlement) => (
                  <TableRow key={settlement.idCashSettlement}>
                    <TableCell className="font-medium">
                      #{settlement.idCashSettlement}
                    </TableCell>
                    <TableCell>{settlement.collectorUserName}</TableCell>
                    <TableCell>{settlement.receivedByUserName}</TableCell>
                    <TableCell>#{settlement.idCashSession}</TableCell>
                    <TableCell>{formatSettlementDate(settlement.settledAt)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatSettlementMoney(settlement.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/admin/cash-settlements/${settlement.idCashSettlement}`,
                          )
                        }
                      >
                        <Eye className="mr-2 size-4" />
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 md:hidden">
          {loading ? (
            <div className="flex min-h-28 items-center justify-center gap-2 rounded-lg border text-muted-foreground">
              <Spinner />
              Cargando rendiciones...
            </div>
          ) : settlements.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay rendiciones registradas.
            </div>
          ) : (
            settlements.map((settlement) => (
              <article
                key={settlement.idCashSettlement}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">#{settlement.idCashSettlement}</p>
                    <p className="text-sm text-muted-foreground">
                      {settlement.collectorUserName}
                    </p>
                  </div>
                  <p className="font-bold">
                    {formatSettlementMoney(settlement.totalAmount)}
                  </p>
                </div>
                <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  <p>Recibió: {settlement.receivedByUserName}</p>
                  <p>Caja: #{settlement.idCashSession}</p>
                  <p>Fecha: {formatSettlementDate(settlement.settledAt)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() =>
                    navigate(`/admin/cash-settlements/${settlement.idCashSettlement}`)
                  }
                >
                  <Eye className="mr-2 size-4" />
                  Ver detalle
                </Button>
              </article>
            ))
          )}
        </div>

        <SettlementPagination pagination={pagination} onChangePage={onChangePage} />
      </CardContent>
    </Card>
  );
};
