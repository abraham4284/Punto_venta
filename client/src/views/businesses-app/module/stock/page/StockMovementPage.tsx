import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { RefreshCw } from "lucide-react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MovementFilter,
  MovementMetrics,
  MovementPagination,
  MovementTable,
} from "../components";
import { useStockMovements } from "../hooks/useStockMovements";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useAuthStore } from "../../auth/store/auth.store";
import { getStockTransferByReferenceRequest } from "../api/stock.movement.api";
import { StockTransferReceiptDialog } from "../components/transfer/StockTransferReceiptDialog";
import { buildStockTransferReceiptFromHistory, getStockTransferHistoryError, readStockTransferHistory } from "../helpers/stock-transfer-receipt.helper";
import type { StockTransferReceiptData } from "../helpers/stock-transfer-receipt.helper";

export const StockMovementPage = () => {
  const {
    movements,
    metrics,
    loading,
    error,
    search,
    filter,
    depositFilter,
    currentPage,
    totalPages,
    totalRecords,
    limit,
    setSearch,
    setFilter,
    setDepositFilter,
    setCurrentPage,
    getStockMovements,
  } = useStockMovements();
  const { deposits, getDeposits } = useDeposits();
  const session = useAuthStore((state) => state.user);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [loadingReference, setLoadingReference] = useState<number | null>(null);
  const [transferError, setTransferError] = useState<{ referenceId: number; message: string } | null>(null);
  const pending = useRef<{ referenceId: number; controller: AbortController } | null>(null);

  useEffect(() => {
    getDeposits();
  }, [getDeposits]);

  useEffect(() => () => pending.current?.controller.abort(), []);

  const viewReceipt = async (referenceId: number) => {
    if (pending.current?.referenceId === referenceId) return;
    pending.current?.controller.abort();
    const controller = new AbortController();
    pending.current = { referenceId, controller };
    setLoadingReference(referenceId);
    setTransferError(null);
    try {
      const { data } = await getStockTransferByReferenceRequest(referenceId, controller.signal);
      if (controller.signal.aborted) return;
      const transfer = readStockTransferHistory(data, referenceId);
      if (!transfer) throw new Error("Respuesta de transferencia inválida");
      setSelectedTransfer(buildStockTransferReceiptFromHistory(transfer, session));
      setReceiptOpen(true);
    } catch (error) {
      if (!controller.signal.aborted) {
        setTransferError({ referenceId, message: getStockTransferHistoryError(isAxiosError(error) ? error.response?.status : undefined) });
      }
    } finally {
      if (pending.current?.controller === controller) {
        pending.current = null;
        if (!controller.signal.aborted) setLoadingReference(null);
      }
    }
  };

  return (
    <>
      <Meta title="Movimientos de Stock" />
      <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Historial de inventario
          </h1>
          <p className="text-muted-foreground">
            Auditoria cronologica de entradas, salidas y transferencias.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={getStockMovements}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </section>

      <MovementMetrics metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <MovementFilter
            search={search}
            filter={filter}
            depositFilter={depositFilter}
            deposits={deposits}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
            onDepositFilterChange={setDepositFilter}
          />

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {transferError && (
            <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p>{transferError.message}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void viewReceipt(transferError.referenceId)}>
                Reintentar comprobante #{transferError.referenceId}
              </Button>
            </div>
          )}
          <MovementTable movements={movements} loading={loading} loadingReference={loadingReference}
            onViewReceipt={(referenceId) => void viewReceipt(referenceId)} />

          <MovementPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            limit={limit}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
      </main>
      {selectedTransfer && (
        <StockTransferReceiptDialog receipt={selectedTransfer} open={receiptOpen} onOpenChange={setReceiptOpen} showTrigger={false} />
      )}
    </>
  );
};
