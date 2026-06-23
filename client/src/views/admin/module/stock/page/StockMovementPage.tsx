import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
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

  useEffect(() => {
    getDeposits();
  }, [getDeposits]);

  return (
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

          <MovementTable movements={movements} loading={loading} />

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
  );
};
