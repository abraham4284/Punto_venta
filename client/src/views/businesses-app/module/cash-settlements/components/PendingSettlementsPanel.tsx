import { useMemo } from "react";
import { Banknote, RefreshCw, ShieldAlert, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { CashSessionResponse } from "../../cash/types";
import {
  calculateSelectedSettlementTotal,
  formatSettlementDate,
  formatSettlementMoney,
} from "../helpers/cash-settlement.helpers";
import type { PendingCashSettlementCollectorResponse } from "../types";

type PendingSettlementsPanelProps = {
  collectors: PendingCashSettlementCollectorResponse[];
  selectedCollectorId: number | null;
  selectedPaymentIds: Set<number>;
  observation: string;
  canCreate: boolean;
  receiverCanCreate: boolean;
  canViewCashSession: boolean;
  canAccessCashPage: boolean;
  cashSession: CashSessionResponse | null;
  pendingLoading: boolean;
  cashSessionLoading: boolean;
  pendingError: string | null;
  cashSessionError: string | null;
  saving: boolean;
  onSelectCollector: (collectorUserId: number | null) => void;
  onTogglePayment: (idSalePayment: number) => void;
  onToggleAll: () => void;
  onObservationChange: (value: string) => void;
  onRefreshPending: () => void;
  onRefreshCashSession: () => void;
  onOpenConfirm: () => void;
};

export const PendingSettlementsPanel = ({
  collectors,
  selectedCollectorId,
  selectedPaymentIds,
  observation,
  canCreate,
  receiverCanCreate,
  canViewCashSession,
  canAccessCashPage,
  cashSession,
  pendingLoading,
  cashSessionLoading,
  pendingError,
  cashSessionError,
  saving,
  onSelectCollector,
  onTogglePayment,
  onToggleAll,
  onObservationChange,
  onRefreshPending,
  onRefreshCashSession,
  onOpenConfirm,
}: PendingSettlementsPanelProps) => {
  const selectedCollector = useMemo(() => {
    return (
      collectors.find((collector) => {
        return collector.collectorUserId === selectedCollectorId;
      }) ?? null
    );
  }, [collectors, selectedCollectorId]);
  const selectedTotal = useMemo(() => {
    return calculateSelectedSettlementTotal(
      selectedCollector?.payments ?? [],
      selectedPaymentIds,
    );
  }, [selectedCollector, selectedPaymentIds]);
  const allSelected =
    selectedCollector !== null &&
    selectedCollector.payments.length > 0 &&
    selectedCollector.payments.every((payment) =>
      selectedPaymentIds.has(payment.idSalePayment),
    );
  const selectedCollectorName =
    selectedCollector?.collectorUserName ?? "Seleccionar cadete";
  const selectionEnabled =
    canCreate && receiverCanCreate && canViewCashSession && cashSession?.status === "OPEN";
  const createDisabled =
    !selectionEnabled ||
    !selectedCollector ||
    selectedPaymentIds.size === 0 ||
    saving ||
    cashSessionLoading;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="size-4" />
              Pendientes de rendición
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Seleccioná solo los pagos que el cadete está entregando ahora.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingLoading}
            onClick={onRefreshPending}
          >
            <RefreshCw
              className={`mr-2 size-4 ${pendingLoading ? "animate-spin" : ""}`}
            />
            Actualizar pendientes
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Caja receptora</p>
                {cashSessionLoading ? (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner />
                    Consultando caja abierta...
                  </p>
                ) : cashSession?.status === "OPEN" ? (
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>{cashSession.cashRegisterName}</p>
                    <p>Sesión #{cashSession.idCashSession}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No hay una caja abierta para recibir la rendición.
                  </p>
                )}
              </div>
              {cashSession?.status === "OPEN" ? (
                <Badge className="bg-emerald-600">Abierta</Badge>
              ) : (
                <Badge variant="outline">Sin caja</Badge>
              )}
            </div>
            {cashSessionError ? (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                {cashSessionError}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {canViewCashSession ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cashSessionLoading}
                  onClick={onRefreshCashSession}
                >
                  Actualizar caja
                </Button>
              ) : null}
              {canAccessCashPage ? (
                <Link
                  to="/admin/cash"
                  className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition hover:bg-muted"
                >
                  Ir a Caja
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-sm font-medium">Resumen seleccionado</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold">{selectedPaymentIds.size}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">
                  {formatSettlementMoney(selectedTotal)}
                </p>
              </div>
            </div>
            {!canCreate ? (
              <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Tenés acceso de consulta. La creación de rendiciones requiere permiso de creación.
              </p>
            ) : null}
            {canCreate && !receiverCanCreate ? (
              <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                Solo usuarios ADMIN u OWNER pueden recibir rendiciones.
              </p>
            ) : null}
            {canCreate && receiverCanCreate && !canViewCashSession ? (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                Necesitás permiso para consultar caja abierta antes de rendir.
              </p>
            ) : null}
          </div>
        </div>

        {pendingError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{pendingError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRefreshPending}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        {pendingLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 rounded-xl border text-muted-foreground">
            <Spinner />
            Cargando pagos pendientes...
          </div>
        ) : collectors.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <WalletCards className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-medium">No hay efectivo pendiente de rendición.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando un cadete cobre pagos en efectivo, aparecerán agrupados en esta sección.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Cadete con efectivo pendiente</Label>
                <Select
                  value={selectedCollectorId ? String(selectedCollectorId) : ""}
                  onValueChange={(value: string | null) => {
                    onSelectCollector(value ? Number(value) : null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <span className="flex flex-1 text-left">
                      {selectedCollectorName}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {collectors.map((collector) => (
                      <SelectItem
                        key={collector.collectorUserId}
                        value={String(collector.collectorUserId)}
                      >
                        {collector.collectorUserName} ·{" "}
                        {formatSettlementMoney(collector.totalAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                {collectors.map((collector) => (
                  <button
                    key={collector.collectorUserId}
                    type="button"
                    className={`rounded-xl border p-4 text-left transition hover:border-primary/60 ${
                      selectedCollectorId === collector.collectorUserId
                        ? "border-primary bg-primary/5"
                        : "bg-card"
                    }`}
                    onClick={() => onSelectCollector(collector.collectorUserId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{collector.collectorUserName}</p>
                        <p className="text-sm text-muted-foreground">
                          {collector.paymentsCount} pagos pendientes
                        </p>
                      </div>
                      <p className="font-bold">
                        {formatSettlementMoney(collector.totalAmount)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {selectedCollector ? (
                <>
                  <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        Pagos de {selectedCollector.collectorUserName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Los pagos no seleccionados quedan pendientes.
                      </p>
                    </div>
                    {canCreate ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!selectionEnabled}
                        onClick={onToggleAll}
                      >
                        {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    {selectedCollector.payments.map((payment) => {
                      const checked = selectedPaymentIds.has(payment.idSalePayment);

                      return (
                        <label
                          key={payment.idSalePayment}
                          className={`flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                            checked ? "border-primary bg-primary/5" : ""
                          } ${!selectionEnabled ? "cursor-default" : ""}`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            {canCreate ? (
                              <input
                                type="checkbox"
                                className="mt-1 size-4 accent-primary"
                                checked={checked}
                                disabled={!selectionEnabled}
                                onChange={() => onTogglePayment(payment.idSalePayment)}
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-semibold">{payment.saleNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {payment.customerName || "Consumidor final"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cobrado: {formatSettlementDate(payment.collectedAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold">
                            {formatSettlementMoney(payment.amount)}
                          </p>
                        </label>
                      );
                    })}
                  </div>

                  {canCreate ? (
                    <div className="grid gap-3 rounded-xl border bg-card p-4">
                      <div className="grid gap-2">
                        <Label>Observación</Label>
                        <Textarea
                          value={observation}
                          maxLength={255}
                          disabled={!selectionEnabled || saving}
                          placeholder="Detalle opcional de la rendición"
                          onChange={(event) =>
                            onObservationChange(event.target.value.slice(0, 255))
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={createDisabled}
                        onClick={onOpenConfirm}
                      >
                        {saving ? (
                          <Spinner className="mr-2 size-4" />
                        ) : (
                          <Banknote className="mr-2 size-4" />
                        )}
                        Rendir seleccionados
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  <ShieldAlert className="size-9" />
                  <p className="mt-3 font-medium text-foreground">
                    Seleccioná un cadete para ver sus pagos.
                  </p>
                  <p className="mt-1 text-sm">
                    La rendición nunca mezcla pagos de distintos cadetes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
