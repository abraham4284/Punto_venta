import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";

import { ModalFormStock, StockFilter, TableStock, CardStockMetric } from "../components";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useProducts } from "../../products/hooks/useProducts";
import { useStock } from "../hooks/useStock";
import type { StockResponse } from "../types/stock.types";

export const StockPage = () => {
  const {
    getStock,
    resetStock,
    loading,
    search,
    setSearch,
    filteredStock,
    metrics,
  } = useStock();

  const { products, getProducts, resetProducts } = useProducts();
  const { deposits, getDeposits, resetDeposits } = useDeposits();

  const {
    isOpen,
    toggleModal,
    closeModal,
    resetDataEdit,
  } = useUtilsState<StockResponse>();

  useEffect(() => {
    getStock();
    getProducts();
    getDeposits();

    return () => {
      resetStock();
      resetProducts();
      resetDeposits();
    };
  }, [getStock, getProducts, getDeposits]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  return (
    <main className="space-y-6 p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Stock de productos
          </h1>
          <p className="text-muted-foreground">
            Gestioná el stock de tus productos.
          </p>
        </div>

        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo stock
        </Button>
      </section>

      <CardStockMetric metrics={metrics} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <StockFilter value={search} onChange={setSearch} />

          <TableStock data={filteredStock} loading={loading} />
        </CardContent>
      </Card>

      <ModalFormStock
        isOpen={isOpen}
        onClose={closeModal}
        products={products}
        deposits={deposits}
        onSuccess={getStock}
      />
    </main>
  );
};
