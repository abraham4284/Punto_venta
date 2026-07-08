import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";

import {
  CardStockMetric,
  ModalFormStock,
  QuickStockAdjustmentModal,
  StockFilter,
  TableStock,
} from "../components";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useProducts } from "../../products/hooks/useProducts";
import { useStock } from "../hooks/useStock";
import type { StockResponse } from "../types/stock.types";

export const StockPage = () => {
  const {
    getStock,
    refreshStock,
    resetStock,
    loading,
    stockData,
    pagination,
    activeFilters,
    applyStockFilters,
    changeStockPage,
    metrics,
    loadingStockBalance,
    fetchCurrentStockBalance,
  } = useStock();

  const { products, getProducts, resetProducts } = useProducts();
  const { deposits, getDeposits, resetDeposits } = useDeposits();

  const {
    isOpen,
    toggleModal,
    closeModal,
    resetDataEdit,
  } = useUtilsState<StockResponse>();
  const {
    isOpen: isOpenQuickAdjust,
    dataEdit: quickAdjustStock,
    addDataEdit: addQuickAdjustStock,
    setIsOpen: setIsOpenQuickAdjust,
    closeModal: closeQuickAdjustModal,
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
  }, [
    getStock,
    getProducts,
    getDeposits,
    resetStock,
    resetProducts,
    resetDeposits,
  ]);

  const handleOpenCreate = () => {
    resetDataEdit();
    toggleModal();
  };

  const handleOpenQuickAdjust = (stock: StockResponse) => {
    addQuickAdjustStock(stock);
    setIsOpenQuickAdjust(true);
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
          <StockFilter
            filters={activeFilters}
            deposits={deposits}
            loading={loading}
            onApply={applyStockFilters}
          />

          <TableStock
            data={stockData}
            loading={loading}
            pagination={pagination}
            onPageChange={changeStockPage}
            onQuickAdjust={handleOpenQuickAdjust}
          />
        </CardContent>
      </Card>

      <ModalFormStock
        isOpen={isOpen}
        onClose={closeModal}
        products={products}
        deposits={deposits}
        onSuccess={refreshStock}
      />
      <QuickStockAdjustmentModal
        isOpen={isOpenQuickAdjust}
        stock={quickAdjustStock}
        deposits={deposits}
        loadingBalance={loadingStockBalance}
        fetchCurrentStockBalance={fetchCurrentStockBalance}
        onClose={closeQuickAdjustModal}
        onSuccess={refreshStock}
      />
      <Toaster position="top-right" reverseOrder={false} />
    </main>
  );
};
