import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import {
  PaginationControls,
  SaleFilters,
  SaleMetrics,
  SaleTable,
} from "../components";
import { useSaleManagement } from "../hooks/useSaleManagement";

export const SaleAllPage = () => {
  const navigate = useNavigate();
  const { deposits, getDeposits, resetDeposits } = useDeposits();
  const {
    sales,
    pagination,
    filters,
    loading,
    cancelingId,
    error,
    metrics,
    getSales,
    updateFilters,
    resetFilters,
    changePage,
    cancelSaleAction,
  } = useSaleManagement();

  useEffect(() => {
    getDeposits();
    getSales(1);

    return () => {
      resetDeposits();
    };
  }, [getDeposits, getSales, resetDeposits]);

  return (
    <main className="space-y-6 bg-white p-2 md:p-6">
      <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Historial de ventas
          </h1>
          <p className="text-muted-foreground">
            Auditoria paginada de operaciones comerciales.
          </p>
        </div>

        <Button type="button" onClick={() => navigate("/admin/sales")}>
          Nueva venta
        </Button>
      </section>

      <SaleMetrics metrics={metrics} />

      <SaleFilters
        filters={filters}
        deposits={deposits}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <SaleTable
            sales={sales}
            loading={loading}
            cancelingId={cancelingId}
            onView={(idSale) => navigate(`/admin/sales/${idSale}`)}
            onCancel={cancelSaleAction}
          />
          <PaginationControls
            pagination={pagination}
            onPageChange={changePage}
          />
        </CardContent>
      </Card>
    </main>
  );
};
