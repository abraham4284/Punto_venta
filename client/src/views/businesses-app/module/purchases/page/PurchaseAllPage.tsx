import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Card, CardContent } from "@/components/ui/card";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useSuppliers } from "../../suppliers/hooks/useSuppliers";
import { PurchaseFilter } from "../components/table/PurchaseFilter";
import { PurchaseTable } from "../components/table/PurchaseTable";
import { usePurchases } from "../hooks/usePurchases";
import type { PurchaseFilters } from "../types";

export const PurchaseAllPage = () => {
  const navigate = useNavigate();
  const { suppliers, getSuppliers, resetSuppliers } = useSuppliers();
  const { deposits, getDeposits, resetDeposits } = useDeposits();
  const {
    purchases,
    pagination,
    filters,
    loading,
    cancelingId,
    error,
    metrics,
    fetchPurchases,
    changePage,
    cancelPurchase,
    resetPurchases,
  } = usePurchases();

  useEffect(() => {
    void getSuppliers();
    void getDeposits();
    void fetchPurchases();

    return () => {
      resetSuppliers();
      resetDeposits();
      resetPurchases();
    };
  }, [
    fetchPurchases,
    getDeposits,
    getSuppliers,
    resetDeposits,
    resetPurchases,
    resetSuppliers,
  ]);

  const handleApplyFilters = (nextFilters: PurchaseFilters) => {
    void fetchPurchases(nextFilters);
  };

  const handleView = (idPurchase: number) => {
    navigate(`/admin/purchases/${idPurchase}`);
  };

  return (
    <>
      <Meta title="Historial de Compras" />
      <main className="space-y-6 p-3 md:p-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">
            Historial de compras
          </h1>
          <p className="text-muted-foreground">
            Auditoria de ingresos, proveedores y anulaciones de mercaderia.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Compras totales</p>
              <p className="text-2xl font-bold">{metrics.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completadas</p>
              <p className="text-2xl font-bold text-emerald-600">
                {metrics.completed}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Monto ingresado</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 2,
                }).format(metrics.completedTotal)}
              </p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <PurchaseFilter
          filters={filters}
          suppliers={suppliers}
          deposits={deposits}
          onApply={handleApplyFilters}
        />

        <PurchaseTable
          purchases={purchases}
          pagination={pagination}
          loading={loading}
          cancelingId={cancelingId}
          onView={handleView}
          onCancel={(idPurchase) => void cancelPurchase(idPurchase)}
          onPageChange={changePage}
        />
      </main>
    </>
  );
};
