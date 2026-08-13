import { useEffect, useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUtilsState } from "@/hooks/useUtilsState";
import { useCan } from "@/views/businesses-app/hooks/useCan";

import {
  CardStockMetric,
  ModalFormStock,
  QuickStockAdjustmentModal,
  StockFilter,
  TableStock,
} from "../components";
import { AddToPurchaseModal } from "../../purchases/components/modal/AddToPurchaseModal";
import { PurchaseCartSheet } from "../../purchases/components/sheet/PurchaseCartSheet";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { useProducts } from "../../products/hooks/useProducts";
import type { ProductResponse } from "../../products/types/products.types";
import type { PurchaseCartItem } from "../../purchases/types";
import { usePurchaseCartStore } from "../../purchases/store/purchaseCart.store";
import { useStock } from "../hooks/useStock";
import type { StockResponse } from "../types/stock.types";

const mapStockToPurchaseProduct = (stock: StockResponse): ProductResponse => {
  return {
    idProduct: stock.idProduct,
    idDeposit: stock.idDeposit,
    idBusiness: stock.idBusiness,
    idProductCategory: 0,
    categoryName: stock.categoryName,
    productCategoryName: stock.categoryName,
    barcode: stock.barcode,
    name: stock.productName,
    description: null,
    imageUrl: stock.productImageUrl,
    priceCost: stock.priceCost,
    priceSale: stock.priceSale,
    priceWholesale: null,
    unitType: stock.unitType,
    stock: stock.quantity,
    stockMin: stock.stock_min,
    isActive: true,
    createdAt: new Date(),
    updatedAt: stock.updatedAt,
  };
};

export const StockPage = () => {
  const navigate = useNavigate();
  const canCreatePurchase = useCan("purchases.create");
  const cart = usePurchaseCartStore((state) => state.cart);
  const addPurchaseItem = usePurchaseCartStore((state) => state.addItem);
  const removePurchaseItem = usePurchaseCartStore((state) => state.removeItem);
  const [purchaseProduct, setPurchaseProduct] =
    useState<ProductResponse | null>(null);
  const [purchaseDepositId, setPurchaseDepositId] = useState<number | null>(
    null,
  );
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPurchaseCartSheetOpen, setIsPurchaseCartSheetOpen] = useState(false);
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
    getProducts({ page: 1, limit: 100, isActive: true });
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

  const handleOpenPurchaseModal = (stock: StockResponse) => {
    setPurchaseProduct(mapStockToPurchaseProduct(stock));
    setPurchaseDepositId(stock.idDeposit);
    setIsPurchaseModalOpen(true);
  };

  const handleAddPurchaseItem = (item: PurchaseCartItem) => {
    addPurchaseItem(item);
    toast.success("Producto agregado al carrito de compra");
    setIsPurchaseCartSheetOpen(true);
  };

  const handleContinuePurchase = () => {
    setIsPurchaseCartSheetOpen(false);
    navigate("/admin/purchases");
  };

  return (
    <>
      <Meta title="Stock" />
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

        <div className="flex flex-col gap-2 sm:flex-row">
          {canCreatePurchase && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPurchaseCartSheetOpen(true)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Carrito ({cart.length})
            </Button>
          )}
          <Button type="button" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo stock
          </Button>
        </div>
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
            onAddToPurchase={handleOpenPurchaseModal}
            canCreatePurchase={canCreatePurchase}
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
      <AddToPurchaseModal
        isOpen={isPurchaseModalOpen}
        product={purchaseProduct}
        deposits={deposits}
        defaultDepositId={purchaseDepositId}
        onClose={() => setIsPurchaseModalOpen(false)}
        onConfirm={handleAddPurchaseItem}
      />
      <PurchaseCartSheet
        isOpen={isPurchaseCartSheetOpen}
        cart={cart}
        canContinue={canCreatePurchase}
        onClose={() => setIsPurchaseCartSheetOpen(false)}
        onContinue={handleContinuePurchase}
        onRemove={removePurchaseItem}
      />
      <Toaster position="top-right" reverseOrder={false} />
      </main>
    </>
  );
};
