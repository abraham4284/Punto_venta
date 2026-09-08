import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { useAuthStore } from "../../auth/store/auth.store";
import { calculateSelectedSettlementTotal } from "../helpers/cash-settlement.helpers";
import { useCashSettlements } from "../hooks/useCashSettlements";
import { CreateSettlementDialog } from "../components/CreateSettlementDialog";
import { PendingSettlementsPanel } from "../components/PendingSettlementsPanel";
import { SettlementHistory } from "../components/SettlementHistory";

export const CashSettlementsPage = () => {
  const canCreate = useCan("cash_settlements.create");
  const canViewCashSession = useCan("cash_sessions.view");
  const canViewCashHistory = useCan("cash_sessions.view_history");
  const canViewCashRegisters = useCan("cash_registers.view");
  const canAccessCashPage =
    canViewCashSession || canViewCashHistory || canViewCashRegisters;
  const userRole = useAuthStore((state) => state.user?.role ?? "");
  const receiverCanCreate = userRole === "OWNER" || userRole === "ADMIN";
  const {
    settlements,
    pendingCollectors,
    filters,
    pagination,
    currentCashSession,
    historyLoading,
    pendingLoading,
    cashSessionLoading,
    saving,
    historyError,
    pendingError,
    cashSessionError,
    fetchSettlements,
    fetchPendingSettlements,
    fetchCurrentCashSession,
    createSettlement,
    applyFilters,
    clearFilters,
    changePage,
  } = useCashSettlements({
    canLoadCashSession: canCreate && receiverCanCreate && canViewCashSession,
  });
  const [selectedCollectorId, setSelectedCollectorId] = useState<number | null>(
    null,
  );
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [observation, setObservation] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selectedCollector = useMemo(() => {
    return (
      pendingCollectors.find((collector) => {
        return collector.collectorUserId === selectedCollectorId;
      }) ?? null
    );
  }, [pendingCollectors, selectedCollectorId]);
  const selectedTotal = useMemo(() => {
    return calculateSelectedSettlementTotal(
      selectedCollector?.payments ?? [],
      selectedPaymentIds,
    );
  }, [selectedCollector, selectedPaymentIds]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (pendingCollectors.length === 0) {
        setSelectedCollectorId(null);
        setSelectedPaymentIds(new Set());
        return;
      }

      if (
        selectedCollectorId &&
        !pendingCollectors.some((collector) => {
          return collector.collectorUserId === selectedCollectorId;
        })
      ) {
        setSelectedCollectorId(null);
        setSelectedPaymentIds(new Set());
        return;
      }

      setSelectedPaymentIds((current) => {
        const availableIds = new Set(
          (selectedCollector?.payments ?? []).map(
            (payment) => payment.idSalePayment,
          ),
        );
        const next = new Set<number>();

        for (const idSalePayment of current) {
          if (availableIds.has(idSalePayment)) {
            next.add(idSalePayment);
          }
        }

        return next;
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pendingCollectors, selectedCollector, selectedCollectorId]);

  const handleSelectCollector = (collectorUserId: number | null) => {
    setSelectedCollectorId(collectorUserId);
    setSelectedPaymentIds(new Set());
  };

  const handleTogglePayment = (idSalePayment: number) => {
    setSelectedPaymentIds((current) => {
      const next = new Set(current);

      if (next.has(idSalePayment)) {
        next.delete(idSalePayment);
      } else {
        next.add(idSalePayment);
      }

      return next;
    });
  };

  const handleToggleAll = () => {
    if (!selectedCollector) return;

    const everySelected = selectedCollector.payments.every((payment) => {
      return selectedPaymentIds.has(payment.idSalePayment);
    });

    if (everySelected) {
      setSelectedPaymentIds(new Set());
      return;
    }

    setSelectedPaymentIds(
      new Set(selectedCollector.payments.map((payment) => payment.idSalePayment)),
    );
  };

  const handleOpenConfirm = () => {
    if (!selectedCollector || selectedPaymentIds.size === 0) {
      toast.error("Seleccioná al menos un pago para rendir");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmSettlement = async () => {
    if (!selectedCollector) return;

    const refreshedSession = await fetchCurrentCashSession();

    if (!refreshedSession || refreshedSession.status !== "OPEN") {
      toast.error("No hay una caja abierta para recibir la rendición");
      return;
    }

    const salePaymentIds = Array.from(selectedPaymentIds);

    if (salePaymentIds.length === 0) {
      toast.error("Seleccioná al menos un pago para rendir");
      return;
    }

    const result = await createSettlement({
      collectorUserId: selectedCollector.collectorUserId,
      idCashSession: refreshedSession.idCashSession,
      salePaymentIds: Array.from(new Set(salePaymentIds)),
      observation: observation.trim() || null,
    });

    if (!result) return;

    setConfirmOpen(false);
    setSelectedPaymentIds(new Set());
    setObservation("");
  };

  const handleRefreshPending = () => {
    void fetchPendingSettlements();
  };

  const handleRefreshCashSession = () => {
    void fetchCurrentCashSession();
  };

  return (
    <>
      <Meta title="Rendiciones de efectivo" />
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Caja y delivery
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Rendiciones de efectivo
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Controlá el dinero cobrado por cadetes, rendí pagos seleccionados y
            auditá el historial sin mezclar ventas, pagos, entregas y caja.
          </p>
        </div>

        <PendingSettlementsPanel
          collectors={pendingCollectors}
          selectedCollectorId={selectedCollectorId}
          selectedPaymentIds={selectedPaymentIds}
          observation={observation}
          canCreate={canCreate}
          receiverCanCreate={receiverCanCreate}
          canViewCashSession={canViewCashSession}
          canAccessCashPage={canAccessCashPage}
          cashSession={currentCashSession}
          pendingLoading={pendingLoading}
          cashSessionLoading={cashSessionLoading}
          pendingError={pendingError}
          cashSessionError={cashSessionError}
          saving={saving}
          onSelectCollector={handleSelectCollector}
          onTogglePayment={handleTogglePayment}
          onToggleAll={handleToggleAll}
          onObservationChange={setObservation}
          onRefreshPending={handleRefreshPending}
          onRefreshCashSession={handleRefreshCashSession}
          onOpenConfirm={handleOpenConfirm}
        />

        <SettlementHistory
          settlements={settlements}
          pendingCollectors={pendingCollectors}
          filters={filters}
          pagination={pagination}
          loading={historyLoading}
          error={historyError}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onChangePage={changePage}
          onRetry={() => {
            void fetchSettlements();
          }}
        />
      </section>

      <CreateSettlementDialog
        isOpen={confirmOpen}
        collector={selectedCollector}
        selectedCount={selectedPaymentIds.size}
        selectedTotal={selectedTotal}
        observation={observation}
        cashSession={currentCashSession}
        saving={saving || cashSessionLoading}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmSettlement();
        }}
      />
    </>
  );
};
