import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MovementFilter,
  MovementMetrics,
  MovementTable,
} from "../components";
import { useStockMovements } from "../hooks/useStockMovements";

export const StockMovementPage = () => {
  const {
    filteredMovements,
    metrics,
    loading,
    error,
    search,
    filter,
    setSearch,
    setFilter,
    getStockMovements,
    resetStockMovements,
  } = useStockMovements();

  useEffect(() => {
    getStockMovements();

    return () => {
      resetStockMovements();
    };
  }, [getStockMovements]);

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
            onSearchChange={setSearch}
            onFilterChange={setFilter}
          />

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <MovementTable data={filteredMovements} loading={loading} />
        </CardContent>
      </Card>
    </main>
  );
};
